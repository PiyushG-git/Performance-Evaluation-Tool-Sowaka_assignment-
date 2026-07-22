const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { getPending, getEmployees, getEmployeeFeedback } = require('../controllers/hrController');

// All HR routes require authentication + hr role
router.use(authMiddleware);
router.use(requireRole('hr'));

// GET /api/hr/pending
// Current cycle: which managers haven't submitted for all their direct reports?
router.get('/pending', getPending);

// GET /api/hr/employees
// All employees in the company with manager and cycle status
router.get('/employees', getEmployees);

// GET /api/hr/feedback/:userId
// Full feedback history for any employee in the company
router.get('/feedback/:userId', getEmployeeFeedback);

module.exports = router;
