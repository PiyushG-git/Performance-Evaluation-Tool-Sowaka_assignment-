const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { getCurrentCycle } = require('../controllers/cycleController');

// All cycle routes require authentication
router.use(authMiddleware);

// GET /api/cycles/current
// Returns the open cycle for this month (auto-creates if missing)
router.get('/current', getCurrentCycle);

module.exports = router;
