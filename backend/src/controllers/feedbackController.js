const prisma = require('../db');

// The 5 fixed parameters for the pilot
const VALID_PARAMETERS = [
  'OWNERSHIP',
  'COMMUNICATION',
  'QUALITY_OF_WORK',
  'COLLABORATION',
  'INITIATIVE',
];

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
// GET /api/feedback/my-team
// Returns all direct reports of the logged-in user + their submission status
// for the current cycle.
// ─────────────────────────────────────────────────────────────────────────────
async function getMyTeam(req, res, next) {
  try {
    const { id: reviewerId, companyId } = req.user;

    const cycle = await getOrCreateCurrentCycle(companyId);

    const reports = await prisma.user.findMany({
      where: { reportsToId: reviewerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        reviewsReceived: {
          where: {
            cycleId: cycle.id,
            reviewerId,
          },
          select: {
            id: true,
            isDraft: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Flatten: attach submission status directly onto each report
    const team = reports.map((member) => {
      const submission = member.reviewsReceived[0] ?? null;
      let status = 'pending';
      if (submission) {
        status = submission.isDraft ? 'draft' : 'submitted';
      }
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        submissionId: submission?.id ?? null,
        submissionStatus: status,
        submittedAt: submission?.submittedAt ?? null,
      };
    });

    return res.json({ cycle, team });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/feedback
// Create or update a DRAFT feedback submission with scores.
// Body: { revieweeId, scores: [{ parameter, score, comment }] }
// ─────────────────────────────────────────────────────────────────────────────
async function saveDraft(req, res, next) {
  try {
    const { id: reviewerId, companyId } = req.user;
    const { revieweeId, scores } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!revieweeId) {
      return res.status(400).json({ error: 'revieweeId is required' });
    }
    if (reviewerId === revieweeId) {
      return res.status(400).json({ error: 'Cannot submit feedback for yourself' });
    }
    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ error: 'scores array is required' });
    }

    // Validate each score entry
    for (const s of scores) {
      if (!VALID_PARAMETERS.includes(s.parameter)) {
        return res.status(400).json({
          error: `Invalid parameter: ${s.parameter}. Must be one of: ${VALID_PARAMETERS.join(', ')}`,
        });
      }
      if (s.score < 1 || s.score > 5 || !Number.isInteger(s.score)) {
        return res.status(400).json({
          error: `Score for ${s.parameter} must be an integer between 1 and 5`,
        });
      }
    }

    // ── Check reviewee is an actual direct report ────────────────────────────
    const reviewee = await prisma.user.findFirst({
      where: { id: revieweeId, reportsToId: reviewerId, companyId },
    });
    if (!reviewee) {
      return res.status(403).json({
        error: 'You can only give feedback to your direct reports',
      });
    }

    // ── Get or create current cycle ──────────────────────────────────────────
    const cycle = await getOrCreateCurrentCycle(companyId);

    // ── Upsert the submission (keep isDraft = true) ──────────────────────────
    const submission = await prisma.feedbackSubmission.upsert({
      where: {
        cycleId_reviewerId_revieweeId: {
          cycleId: cycle.id,
          reviewerId,
          revieweeId,
        },
      },
      update: { updatedAt: new Date() },
      create: {
        cycleId: cycle.id,
        reviewerId,
        revieweeId,
        isDraft: true,
      },
    });

    // ── Check submission isn't already finalized ─────────────────────────────
    if (!submission.isDraft) {
      return res.status(409).json({
        error: 'Feedback for this employee has already been submitted and cannot be changed',
      });
    }

    // ── Upsert each score (one per parameter) ────────────────────────────────
    const upsertedScores = await Promise.all(
      scores.map((s) =>
        prisma.feedbackScore.upsert({
          where: {
            submissionId_parameter: {
              submissionId: submission.id,
              parameter: s.parameter,
            },
          },
          update: { score: s.score, comment: s.comment ?? '' },
          create: {
            submissionId: submission.id,
            parameter: s.parameter,
            score: s.score,
            comment: s.comment ?? '',
          },
        })
      )
    );

    return res.json({
      message: 'Draft saved successfully',
      submission: { ...submission, scores: upsertedScores },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/feedback/:id/submit
// Finalize a draft submission (sets isDraft = false, submittedAt = now).
// All 5 parameters must have scores + non-empty comments.
// ─────────────────────────────────────────────────────────────────────────────
async function submitFeedback(req, res, next) {
  try {
    const { id: reviewerId } = req.user;
    const { id: submissionId } = req.params;

    // Fetch the submission with its scores
    const submission = await prisma.feedbackSubmission.findUnique({
      where: { id: submissionId },
      include: { scores: true },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    if (submission.reviewerId !== reviewerId) {
      return res.status(403).json({ error: 'You can only submit your own feedback' });
    }
    if (!submission.isDraft) {
      return res.status(409).json({ error: 'Feedback has already been submitted' });
    }

    // All 5 parameters must be scored
    if (submission.scores.length < VALID_PARAMETERS.length) {
      const given = submission.scores.map((s) => s.parameter);
      const missing = VALID_PARAMETERS.filter((p) => !given.includes(p));
      return res.status(400).json({
        error: `Missing scores for: ${missing.join(', ')}`,
      });
    }

    // All comments must be non-empty on final submit
    const emptyComment = submission.scores.find((s) => !s.comment?.trim());
    if (emptyComment) {
      return res.status(400).json({
        error: `Comment is required for parameter: ${emptyComment.parameter}`,
      });
    }

    // Finalize
    const finalized = await prisma.feedbackSubmission.update({
      where: { id: submissionId },
      data: { isDraft: false, submittedAt: new Date() },
      include: { scores: true },
    });

    return res.json({
      message: 'Feedback submitted successfully',
      submission: finalized,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feedback/my-scores
// Returns the logged-in user's received (non-draft) feedback grouped by cycle.
// ─────────────────────────────────────────────────────────────────────────────
async function getMyScores(req, res, next) {
  try {
    const { id: revieweeId } = req.user;

    const submissions = await prisma.feedbackSubmission.findMany({
      where: { revieweeId, isDraft: false },
      include: {
        scores: {
          orderBy: { parameter: 'asc' },
        },
        cycle: {
          select: { id: true, year: true, month: true, status: true },
        },
        reviewer: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { cycle: { year: 'desc' } },
        { cycle: { month: 'desc' } },
      ],
    });

    // Group by cycle for the frontend history table
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
      history: Object.values(grouped), // ordered newest first
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feedback/:submissionId
// Returns a single submission with scores (reviewer can access their own submissions)
// ─────────────────────────────────────────────────────────────────────────────
async function getSubmission(req, res, next) {
  try {
    const { id: userId } = req.user;
    const { submissionId } = req.params;

    const submission = await prisma.feedbackSubmission.findUnique({
      where: { id: submissionId },
      include: {
        scores: { orderBy: { parameter: 'asc' } },
        reviewee: { select: { id: true, name: true, email: true } },
        cycle: { select: { id: true, year: true, month: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    // Only reviewer can fetch their own submission via this endpoint
    if (submission.reviewerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(submission);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyTeam,
  saveDraft,
  submitFeedback,
  getMyScores,
  getSubmission,
};
