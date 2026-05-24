/**
 * Profile Routes — DriveCare
 *
 * GET  /api/profile          → fetch current user's full profile
 * PUT  /api/profile          → update name / phone
 * PUT  /api/profile/password → change password (requires currentPassword)
 */

const express = require('express');
const auth    = require('../middleware/authMiddleware');
const User    = require('../models/User-hybrid');
const { hashPassword, verifyPassword } = require('../utils/password');

const router = express.Router();

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

// ─── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    console.error('[profile/GET]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
router.put('/', auth, async (req, res) => {
  const { name, phone } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ msg: 'Name is required' });
  }
  if (phone && !PHONE_RE.test(phone)) {
    return res.status(400).json({ msg: 'Enter a valid phone number' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.name  = name.trim().replace(/[<>]/g, '');
    user.phone = phone !== undefined ? phone.trim() : user.phone;
    await user.save();

    res.json(user.toJSON());
  } catch (err) {
    console.error('[profile/PUT]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ─── PUT /api/profile/password ────────────────────────────────────────────────
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: 'Current password and new password are required' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ msg: 'New password must be at least 8 characters' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ msg: 'New password must be different from current password' });
  }

  try {
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(401).json({ msg: 'Current password is incorrect' });
    }

    user.passwordHash = hashPassword(newPassword);
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error('[profile/password]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
