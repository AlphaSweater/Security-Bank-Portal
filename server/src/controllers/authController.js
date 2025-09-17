import bcrypt from 'bcrypt';
import { findUserByEmail } from '../models/User.js';

// Login controller with session regeneration and role assignment
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.regenerate(err => {
      if (err) return res.status(500).json({ message: 'Session error' });
      req.session.userId = user.id;
      req.session.roles = user.roles;
      res.json({ message: 'Logged in', userId: user.id, roles: user.roles });
    });
  } catch (err) {
    next(err);
  }
}

// Logout controller
export function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('sid');
    res.json({ message: 'Logged out' });
  });
}
