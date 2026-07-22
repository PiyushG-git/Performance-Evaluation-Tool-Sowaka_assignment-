const router = require('express').Router();

// GET /api/hr/pending         — implemented in Phase 4
// GET /api/hr/employees       — implemented in Phase 4
// GET /api/hr/feedback/:userId — implemented in Phase 4

router.get('/', (_req, res) => res.json({ message: 'HR routes ready' }));

module.exports = router;
