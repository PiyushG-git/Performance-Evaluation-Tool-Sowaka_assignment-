const prisma = require('../db');

/**
 * GET /api/cycles/current
 * Returns the current month's open cycle for the logged-in user's company.
 * Auto-creates it if it doesn't exist yet.
 */
async function getCurrentCycle(req, res, next) {
  try {
    const { companyId } = req.user;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1–12

    // upsert: find existing cycle or create a new open one
    const cycle = await prisma.feedbackCycle.upsert({
      where: {
        companyId_year_month: { companyId, year, month },
      },
      update: {}, // nothing to update if it exists
      create: { companyId, year, month, status: 'open' },
    });

    return res.json(cycle);
  } catch (err) {
    next(err);
  }
}

module.exports = { getCurrentCycle };
