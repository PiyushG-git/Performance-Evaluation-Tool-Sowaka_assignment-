const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getMyTeam,
  saveDraft,
  submitFeedback,
  getMyScores,
  getSubmission,
} = require('../controllers/feedbackController');

// All feedback routes require authentication
router.use(authMiddleware);

// ── Manager / HR routes (give feedback) ───────────────────────────────────────

// GET /api/feedback/my-team
// Returns direct reports + their submission status for the current cycle
router.get('/my-team', requireRole('manager', 'hr'), getMyTeam);

// POST /api/feedback
// Create or update a draft submission (body: { revieweeId, scores[] })
router.post('/', requireRole('manager', 'hr'), saveDraft);

// POST /api/feedback/:id/submit
// Finalize a draft → marks isDraft: false
router.post('/:id/submit', requireRole('manager', 'hr'), submitFeedback);

// GET /api/feedback/submission/:submissionId
// Fetch a single draft/submitted submission (reviewer only)
router.get('/submission/:submissionId', requireRole('manager', 'hr'), getSubmission);

// ── Employee route (receive feedback) ─────────────────────────────────────────

// GET /api/feedback/my-scores
// Returns logged-in user's received feedback history (all roles can view their own)
router.get('/my-scores', getMyScores);

module.exports = router;
