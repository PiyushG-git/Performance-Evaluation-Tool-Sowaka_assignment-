const router = require('express').Router();

// GET  /api/feedback/my-team    — implemented in Phase 3
// POST /api/feedback            — implemented in Phase 3
// POST /api/feedback/:id/submit — implemented in Phase 3
// GET  /api/feedback/my-scores  — implemented in Phase 3

router.get('/', (_req, res) => res.json({ message: 'Feedback routes ready' }));

module.exports = router;
