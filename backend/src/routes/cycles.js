const router = require('express').Router();

// GET /api/cycles/current — implemented in Phase 3

router.get('/', (_req, res) => res.json({ message: 'Cycles routes ready' }));

module.exports = router;
