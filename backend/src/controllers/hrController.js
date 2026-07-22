const prisma = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get or create the current cycle for a company
// ─────────────────────────────────────────────────────────────────────────────
async function getOrCreateCurrentCycle(companyId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return prisma.feedbackCycle.upsert({
    where: { companyId_year_month: { companyId, year, month } },
    update: {},
    create: { companyId, year, month, status: 'open' },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hr/pending
// For the current cycle: returns every user who has at least one direct report
// (i.e., every "manager" in the hierarchy sense), along with:
//   - how many reports they have
//   - which ones they have already submitted feedback for
//   - which ones are still pending
//
// Works for ALL roles (hr, manager, employee) — anyone with reports is a manager
// in the hierarchy sense. Kavita (hr) appears here if she has direct reports.
// ─────────────────────────────────────────────────────────────────────────────
async function getPending(req, res, next) {
  try {
    const { companyId } = req.user;

    const cycle = await getOrCreateCurrentCycle(companyId);

    // Fetch all users in the company who have at least one direct report
    const managersWithReports = await prisma.user.findMany({
      where: {
        companyId,
        reports: { some: {} }, // has at least one direct report
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        reports: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Fetch all FINALIZED submissions for this cycle in the company
    const submissions = await prisma.feedbackSubmission.findMany({
      where: { cycleId: cycle.id, isDraft: false },
      select: {
        reviewerId: true,
        revieweeId: true,
        submittedAt: true,
      },
    });

    // Build a lookup: reviewerId → Set of revieweeIds they've submitted for
    const submittedMap = {};
    for (const sub of submissions) {
      if (!submittedMap[sub.reviewerId]) {
        submittedMap[sub.reviewerId] = new Set();
      }
      submittedMap[sub.reviewerId].add(sub.revieweeId);
    }

    // Build the pending summary for each manager
    const pendingSummary = managersWithReports.map((manager) => {
      const submitted = [];
      const pending = [];

      for (const report of manager.reports) {
        const done = submittedMap[manager.id]?.has(report.id) ?? false;
        if (done) {
          submitted.push({ id: report.id, name: report.name, email: report.email });
        } else {
          pending.push({ id: report.id, name: report.name, email: report.email });
        }
      }

      return {
        managerId: manager.id,
        managerName: manager.name,
        managerEmail: manager.email,
        managerRole: manager.role,
        totalReports: manager.reports.length,
        submittedCount: submitted.length,
        pendingCount: pending.length,
        isFullySubmitted: pending.length === 0,
        submitted,
        pending,
      };
    });

    // Summary stats for dashboard cards
    const totalManagers = pendingSummary.length;
    const fullySubmitted = pendingSummary.filter((m) => m.isFullySubmitted).length;
    const withPending = totalManagers - fullySubmitted;

    return res.json({
      cycle,
      summary: { totalManagers, fullySubmitted, withPending },
      managers: pendingSummary,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hr/employees
// Returns all employees in the company with their manager's name
// and their submission status in the current cycle (as a reviewee).
// ─────────────────────────────────────────────────────────────────────────────
async function getEmployees(req, res, next) {
  try {
    const { companyId } = req.user;

    const cycle = await getOrCreateCurrentCycle(companyId);

    const employees = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        reportsTo: {
          select: { id: true, name: true },
        },
        // Has their manager submitted feedback for them this cycle?
        reviewsReceived: {
          where: { cycleId: cycle.id, isDraft: false },
          select: { id: true, submittedAt: true },
        },
        // Are they a manager? (have direct reports)
        _count: { select: { reports: true } },
      },
      orderBy: { name: 'asc' },
    });

    const result = employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      manager: emp.reportsTo ?? null,
      hasDirectReports: emp._count.reports > 0,
      currentCycleFeedbackReceived: emp.reviewsReceived.length > 0,
      feedbackReceivedAt: emp.reviewsReceived[0]?.submittedAt ?? null,
      joinedAt: emp.createdAt,
    }));

    return res.json({ cycle, employees: result });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hr/feedback/:userId
// HR-only: returns the full feedback history for any employee.
// ─────────────────────────────────────────────────────────────────────────────
async function getEmployeeFeedback(req, res, next) {
  try {
    const { companyId } = req.user;
    const { userId } = req.params;

    // Verify the target user belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Employee not found in your company' });
    }

    const submissions = await prisma.feedbackSubmission.findMany({
      where: { revieweeId: userId, isDraft: false },
      include: {
        scores: { orderBy: { parameter: 'asc' } },
        cycle: { select: { id: true, year: true, month: true, status: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: [
        { cycle: { year: 'desc' } },
        { cycle: { month: 'desc' } },
      ],
    });

    // Group by cycle (same format as my-scores for consistency)
    const grouped = {};
    for (const sub of submissions) {
      const key = `${sub.cycle.year}-${String(sub.cycle.month).padStart(2, '0')}`;
      if (!grouped[key]) {
        grouped[key] = {
          cycleId: sub.cycle.id,
          year: sub.cycle.year,
          month: sub.cycle.month,
          cycleStatus: sub.cycle.status,
          reviewer: sub.reviewer,
          scores: {},
        };
      }
      for (const score of sub.scores) {
        grouped[key].scores[score.parameter] = {
          score: score.score,
          comment: score.comment,
        };
      }
    }

    return res.json({
      employee: targetUser,
      history: Object.values(grouped),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPending, getEmployees, getEmployeeFeedback };
