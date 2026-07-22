const { verifyToken } = require('../utils/jwt');

/**
 * Middleware: verifies the JWT from the Authorization header.
 * On success, attaches `req.user = { id, companyId, role }` and calls next().
 * On failure, returns 401.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      companyId: decoded.companyId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
