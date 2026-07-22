# Performance Evaluation Tool

A multi-tenant monthly performance feedback platform where managers review their direct reports
across 5 fixed parameters. Built with **React + Vite**, **Node.js + Express**, and **PostgreSQL + Prisma**.

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

## Project Structure

```
sowaka-eval/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   ← Full data model
│   │   └── seed.js         ← Seed both companies
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a hosted instance)

### 1. Clone & install

```bash
git clone <repo-url>
cd sowaka-eval
```

### 2. Backend setup

```bash
cd backend
npm install

# Copy and fill in your env vars
cp .env.example .env
# Edit DATABASE_URL in .env to point to your PostgreSQL instance
```

### 3. Run migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the database

```bash
npm run seed
```

### 5. Start the backend

```bash
npm run dev
# Server runs on http://localhost:5000
```

### 6. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## Seed Login Credentials

All passwords: **`Password@123`**

### Ashoka Textiles

| Email | Role | Reports To | Manages |
|---|---|---|---|
| amit@ashoka.com | employee (COO) | — | Rohan, Kavita |
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
| sanjay@brightpath.com | manager (Founder) | — | 8 employees + Meera |
| meera@brightpath.com | **hr** | Founder | — |
| aditya@brightpath.com | employee | Founder | — |
| pooja@brightpath.com | employee | Founder | — |
| rahul@brightpath.com | employee | Founder | — |
| neha@brightpath.com | employee | Founder | — |
| vivek@brightpath.com | employee | Founder | — |
| shruti@brightpath.com | employee | Founder | — |
| manish@brightpath.com | employee | Founder | — |
| lakshmi@brightpath.com | employee | Founder | — |

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
| GET | `/api/feedback/my-scores` | All | Own received scores history |
| GET | `/api/hr/pending` | hr | Pending submissions tracker |
| GET | `/api/hr/employees` | hr | All employees + status |
| GET | `/api/hr/feedback/:userId` | hr | Any employee's feedback history |
