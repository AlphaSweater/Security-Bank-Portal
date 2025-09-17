import express from 'express';
import requireAuth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  res.json({ userId: req.session.userId, roles: req.session.roles });
});

// Example: only admin can access
router.get('/admin-data', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ secret: 'This is admin-only data' });
});

export default router;
