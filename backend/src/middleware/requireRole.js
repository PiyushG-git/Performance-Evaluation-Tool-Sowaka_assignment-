/**
 * Middleware factory: restricts a route to specific roles.
 *
 * Usage:
 *   router.get('/pending', authMiddleware, requireRole('hr'), handler)
 *   router.get('/team',    authMiddleware, requireRole('manager', 'hr'), handler)
 *
 * @param {...string} roles - allowed roles ('hr', 'manager', 'employee')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
}

module.exports = requireRole;
