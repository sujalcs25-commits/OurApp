/**
 * Auth Routes — DriveCare
 *
 * POST /api/auth/register  → create account (+ optional first vehicle)
 * POST /api/auth/login     → authenticate and return JWT
 */

const express = require('express');

const User    = require('../models/User-hybrid');
const Vehicle = require('../models/Vehicle-hybrid');
const { signToken }                  = require('../utils/jwt');
const { hashPassword, verifyPassword } = require('../utils/password');

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Return only safe user fields in API responses */
function sanitizeUser(user) {
  return {
    id:    user.id || user._id,
    name:  user.name,
    email: user.email,
    phone: user.phone || '',
  };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, vehicle } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!name?.trim() || !normalizedEmail || !password) {
    return res.status(400).json({ msg: 'Name, email, and password are required' });
  }
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ msg: 'A valid email address is required' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ msg: 'Password must be at least 8 characters long' });
  }

  try {
    // Check if user exists
    let existing = await User.findOne({ email: normalizedEmail }).lean();
    
    if (existing) {
      return res.status(409).json({ msg: 'An account with this email already exists' });
    }

    const safeName = name.trim().replace(/[<>]/g, '');
    
    // Create user
    let user = await User.create({
      name: safeName,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    });

    // Create vehicle if provided
    let createdVehicle = null;
    if (vehicle && (vehicle.make?.trim() || vehicle.model?.trim())) {
      let parsedYear = vehicle.year ? Number(vehicle.year) : null;
      if (parsedYear !== null && (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100)) {
        parsedYear = null; // Fallback for invalid year
      }

      let parsedOdometer = vehicle.odometer ? Number(vehicle.odometer) : 0;
      if (isNaN(parsedOdometer) || parsedOdometer < 0) {
        parsedOdometer = 0;
      }

      const vehicleData = {
        userId: user._id,
        make: vehicle.make?.trim() || 'Vehicle',
        model: vehicle.model?.trim() || 'Not set',
        year: parsedYear,
        licensePlate: vehicle.licensePlate?.trim() || 'Pending',
        odometer: parsedOdometer,
        fuelType: vehicle.fuelType || 'Petrol',
      };
      
      try {
        createdVehicle = await Vehicle.create(vehicleData);
      } catch (err) {
        console.error('[auth/register] Failed to create initial vehicle:', err.message);
        await User.deleteOne({ _id: user._id });
        return res.status(400).json({ msg: 'Failed to save vehicle details. Please check your inputs.' });
      }
    }

    const token = signToken({ id: user._id, name: user.name, email: user.email });
    if (!token) return res.status(500).json({ msg: 'JWT_SECRET is not configured' });

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
      vehicles: createdVehicle ? [createdVehicle] : [],
    });
  } catch (err) {
    console.error('[auth/register]', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }

  try {
    // Find user
    let user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id, name: user.name, email: user.email });
    if (!token) return res.status(500).json({ msg: 'JWT_SECRET is not configured' });

    // Get vehicles
    let vehicles = await Vehicle.find({ userId: user._id });
    vehicles = vehicles.map((v) => v.toJSON());

    return res.json({
      token,
      user: sanitizeUser(user),
      vehicles: vehicles,
    });
  } catch (err) {
    console.error('[auth/login]', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
