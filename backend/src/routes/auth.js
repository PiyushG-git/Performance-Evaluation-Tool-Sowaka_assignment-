const router = require('express').Router();

// POST /api/auth/login   — implemented in Phase 2
// GET  /api/auth/me      — implemented in Phase 2

router.get('/', (_req, res) => res.json({ message: 'Auth routes ready' }));

module.exports = router;
