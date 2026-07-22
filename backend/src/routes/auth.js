const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { signToken } = require('../utils/jwt');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// Returns: { token, user: { id, name, email, role, companyId, companyName } }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find the user (email is unique across all companies)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign JWT
    const token = signToken({
      id: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
        reportsToId: user.reportsToId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Headers: Authorization: Bearer <token>
// Returns: the logged-in user's profile (no passwordHash)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        reportsToId: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
        reportsTo: { select: { id: true, name: true } },
        // Count direct reports to know if this user is also a manager
        _count: { select: { reports: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      ...user,
      hasDirectReports: user._count.reports > 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
