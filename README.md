# Performance Evaluation Tool

A multi-tenant monthly performance feedback platform where managers review their direct reports
across 5 fixed parameters. Built with **React + Vite**, **Node.js + Express**, and **PostgreSQL + Prisma**.

>  **Important:** This app uses **pre-seeded demo data only**. There is no UI to register new companies, create employees, or manage users. All logins, companies, and org structures are fixed via the seed script.

---

## Assumptions

1. **Multi-tenancy via `companyId`** — All companies share the same database. Row-level isolation
   is enforced by `companyId` on every table.

2. **Roles** — `hr`, `manager`, `employee`. These are permission roles, not job titles.
   - A `manager` also receives feedback (they have their own manager above them).
   - An `hr` user is a full participant: they receive feedback (via `reportsTo`), may give feedback
     to their own direct reports, and additionally access the HR dashboard.

3. **Feedback cycle = calendar month** — One submission per `(cycleId, reviewerId, revieweeId)`,
   enforced by a unique constraint at the database level.

4. **5 fixed parameters** (pilot) — `OWNERSHIP`, `COMMUNICATION`, `QUALITY_OF_WORK`,
   `COLLABORATION`, `INITIATIVE`.

5. **`reportsTo` drives the feedback graph** — Whoever a user reports to is responsible for
   submitting their monthly feedback. This applies uniformly to all roles.

6. **No self-feedback** — Enforced at the API level.

7. **HR sees all** — HR users can view the full company-wide pending tracker and any employee's
   feedback history.

8. **No sign-up flow** — User accounts are created only via the seed script. The app is a closed
   pilot tool, not a public product.

---

## Data Model

```
companies ──< users (reportsTo self-ref) ──< feedbackSubmissions >── feedbackCycles
                                                      │
                                               feedbackScores (5 per submission)
```

Key constraints:
- `@@unique([companyId, year, month])` on `FeedbackCycle` — one cycle per company per month
- `@@unique([cycleId, reviewerId, revieweeId])` on `FeedbackSubmission` — no double submissions
- `@@unique([submissionId, parameter])` on `FeedbackScore` — one score per parameter per submission

---

## Data Model — Scenario Validation

> The assignment specifically asks: *"does your data model actually hold up for these scenarios, not just whether the demo screens work?"*
>
> Here is how each real-world scenario maps directly to a schema-level constraint or design decision — not a UI workaround.

---

### Scenario 1 — Priya gives feedback to her 6 team members

**Model design:** The `User` table has a **self-referential `reportsTo` field**.

```prisma
reportsToId  String?                       // nullable — top-level users have no manager
reportsTo    User?  @relation("Hierarchy") // the person this user reports to
reports      User[] @relation("Hierarchy") // this user's direct reports
```

Priya's 6 team members each have `reportsToId = priya.id`. The API resolves her direct reports by querying `User.reports` — no hardcoding, works for any org depth.

---

### Scenario 2 — Priya herself gets feedback from Rohan

**Model design:** `FeedbackSubmission` has **two independent foreign keys to `User`**.

```prisma
reviewerId  String  // the person GIVING feedback  → Rohan
revieweeId  String  // the person RECEIVING feedback → Priya
```

Priya is simultaneously a `reviewerId` (gives feedback to her 6 reports) and a `revieweeId` (receives feedback from Rohan). There is no role conflict — the model treats these as independent relationships, not mutually exclusive states.

---

### Scenario 3 — Bright Path founder gives feedback to 8 people directly (flat hierarchy)

**Model design:** `reportsToId` is **nullable**, meaning top-level users (founder, COO) simply have no manager assigned.

```prisma
reportsToId  String?  // null = no manager above them
```

Sanjay (Founder) has `reportsToId = null` and 8 entries in `reports[]`. Structurally identical to the multi-layer hierarchy at Ashoka — the model handles both shapes with the same schema, no special casing.

---

### Scenario 4 — Kavita (HR) checks who hasn't submitted feedback yet

**Model design:** The HR "pending" query cross-references expected vs. actual submissions using two constraints:

```prisma
// One cycle per company per month — no ambiguity about which cycle is "current"
@@unique([companyId, year, month])

// One submission per (manager → employee) per cycle — no duplicates, easy gap detection
@@unique([cycleId, reviewerId, revieweeId])
```

For every user with `reports.length > 0`, the API checks whether a non-draft `FeedbackSubmission` exists for each direct report in the current cycle. Missing rows = pending. The unique constraint guarantees no double-counting.

---

### Scenario 5 — Multiple companies share the same app, data stays isolated

**Model design:** Every table that holds user data is scoped by `companyId`, which is indexed for query performance.

```prisma
model User          { companyId String; @@index([companyId]) }
model FeedbackCycle { companyId String; @@index([companyId]) }
```

Every API handler extracts `companyId` from the verified JWT and applies it as a mandatory filter on every database query. A user from Ashoka Textiles cannot read or write Bright Path data — enforced at the database query level, not just the UI.

---

### Scenario 6 — Employees see their own scores per parameter, over past months

**Model design:** Scores are stored at the **parameter level**, not rolled up, preserving full per-parameter history.

```prisma
model FeedbackScore {
  parameter    Parameter  // enum: OWNERSHIP | COMMUNICATION | QUALITY_OF_WORK | COLLABORATION | INITIATIVE
  score        Int        // 1–5
  comment      String     // manager's written reasoning

  // Exactly one score per parameter per submission — no gaps, no duplicates
  @@unique([submissionId, parameter])
}
```

The history query joins `FeedbackScore → FeedbackSubmission → FeedbackCycle`, grouped by month, giving a complete per-parameter time-series for any employee.

---

### Summary Table

| Scenario | Schema-Level Guarantee |
|---|---|
| Hierarchical reporting (any depth) | Self-referential `reportsTo` on `User` |
| Same person is reviewer AND reviewee | Separate `reviewerId` / `revieweeId` FK fields |
| One cycle per company per month | `@@unique([companyId, year, month])` |
| No duplicate submissions | `@@unique([cycleId, reviewerId, revieweeId])` |
| Exactly 5 scores per submission | `Parameter` enum + `@@unique([submissionId, parameter])` |
| Company data isolation | `companyId` on every table, enforced in every API query |
| Top-level users with no manager | Nullable `reportsToId` |

---

## Project Structure

```
sowaka-eval/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   ← Full data model
│   │   └── seed.js         ← Seed script for both companies
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── utils/
│   ├── .env.example        ← Copy this to .env and fill in your values
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (e.g. via pgAdmin, or `brew services start postgresql`)

---

### Step 1 — Clone & install

```bash
git clone <repo-url>
cd sowaka-eval
```

---

### Step 2 — Configure the backend `.env`

Navigate to the `backend/` folder and create your `.env` file by copying the example:

```bash
cd backend
cp .env.example .env
```

Now open `backend/.env` and fill in your PostgreSQL connection details:

```env
# PostgreSQL connection string
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/sowaka_eval"

# JWT secret — use any long random string
JWT_SECRET="any-long-random-string-you-choose"

# JWT expiry
JWT_EXPIRES_IN="7d"

# Backend port
PORT=5000

# Frontend URL (for CORS)
CLIENT_URL="http://localhost:5173"
```

>  **Tip:** The database (`sowaka_eval` in the example) does not need to exist yet — Prisma will create the tables. But your PostgreSQL **server must be running** and the **username/password must be correct**.
>
> Common values if you installed PostgreSQL with default settings:
> - Username: `postgres`
> - Password: whatever you set during installation
> - Host: `localhost`
> - Port: `5432`

---

### Step 3 — Run database migrations

This creates all the tables in your PostgreSQL database:

```bash
npx prisma migrate dev --name init
```

---

### Step 4 — Seed the database

This populates both pilot companies, all employees, and the org hierarchy:

```bash
npm run seed
```

You should see output like:
```
✅ Companies created
✅ Users created for Ashoka Textiles
✅ Users created for Bright Path Consulting
🎉 Seed complete! All passwords are: Password@123
```

>  **Do not skip this step.** Without seeding, there are no users to log in with.

---

### Step 5 — Start the backend

```bash
npm run dev
# Server starts at http://localhost:5000
```

---

### Step 6 — Set up and start the frontend

Open a new terminal:

```bash
cd ../frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## Seed Login Credentials

> All passwords: **`Password@123`**
>
> You **cannot** create new accounts from the UI. Use the credentials below to log in.

### Ashoka Textiles

| Email | Role | Reports To | Manages |
|---|---|---|---|
| amit@ashoka.com | employee (COO) | — (top-level) | Rohan, Kavita |
| rohan@ashoka.com | manager | Amit | Priya |
| priya@ashoka.com | manager | Rohan | 6 employees |
| sneha@ashoka.com | employee | Priya | — |
| raj@ashoka.com | employee | Priya | — |
| arjun@ashoka.com | employee | Priya | — |
| divya@ashoka.com | employee | Priya | — |
| kiran@ashoka.com | employee | Priya | — |
| meena@ashoka.com | employee | Priya | — |
| kavita@ashoka.com | **hr** | Amit | Ananya, Vikram |
| ananya@ashoka.com | employee | Kavita | — |
| vikram.hr@ashoka.com | employee | Kavita | — |

### Bright Path Consulting

| Email | Role | Reports To | Manages |
|---|---|---|---|
| sanjay@brightpath.com | manager (Founder) | — (top-level) | 8 employees + Meera |
| meera@brightpath.com | **hr** | Sanjay | — |
| aditya@brightpath.com | employee | Sanjay | — |
| pooja@brightpath.com | employee | Sanjay | — |
| rahul@brightpath.com | employee | Sanjay | — |
| neha@brightpath.com | employee | Sanjay | — |
| vivek@brightpath.com | employee | Sanjay | — |
| shruti@brightpath.com | employee | Sanjay | — |
| manish@brightpath.com | employee | Sanjay | — |
| lakshmi@brightpath.com | employee | Sanjay | — |

---

## What Each Role Can Do

| Feature | Employee | Manager | HR |
|---|:---:|:---:|:---:|
| View own score history & trends | ✅ | ✅ | ✅ |
| See manager's written comments | ✅ | ✅ | ✅ |
| Give feedback to direct reports | — | ✅ | ✅ |
| Save feedback as draft | — | ✅ | ✅ |
| Submit final feedback | — | ✅ | ✅ |
| View company-wide pending tracker | — | — | ✅ |
| View any employee's history | — | — | ✅ |
| Export pending report as CSV | — | — | ✅ |
| Search employee directory | — | — | ✅ |

---

## API Overview

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | All | Login, returns JWT |
| GET | `/api/auth/me` | All | Current user profile |
| GET | `/api/cycles/current` | All | Get/create current month cycle |
| GET | `/api/feedback/my-team` | manager, hr | Direct reports + submission status |
| POST | `/api/feedback` | manager, hr | Save/update draft feedback |
| POST | `/api/feedback/:id/submit` | manager, hr | Finalize submission |
| GET | `/api/feedback/submission/:id` | manager, hr | Get scores for a submission |
| GET | `/api/feedback/my-scores` | All | Own received scores history |
| GET | `/api/hr/pending` | hr | Pending submissions tracker |
| GET | `/api/hr/employees` | hr | All employees + status |
| GET | `/api/hr/feedback/:userId` | hr | Any employee's feedback history |

---

## Troubleshooting

**`DATABASE_URL` not found / Prisma error**
- Make sure `backend/.env` exists (not just `.env.example`).
- Double-check your PostgreSQL username, password, and that the PostgreSQL service is running.

**Port 5000 already in use**
- Another process is using port 5000. Either stop it, or change `PORT=5001` in your `backend/.env`.

**`npm run seed` fails**
- Ensure migrations ran first: `npx prisma migrate dev --name init`
- Ensure your `DATABASE_URL` is correct and the database is reachable.

**Login says "Invalid credentials"**
- Make sure you ran `npm run seed` — without it, there are no users in the database.
- All passwords are exactly: `Password@123`
