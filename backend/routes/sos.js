/**
 * SOS Routes — DriveCare (MongoDB version)
 *
 * Emergency contacts are embedded in the User document (max 5).
 * SOS events are stored as separate SosLog documents for efficient querying.
 *
 * SMS via Twilio REST API (Node 18+ built-in fetch).
 * Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env.
 * If absent, SMS is skipped but the SOS log is still created.
 */

const express  = require('express');
const mongoose = require('mongoose');

const auth   = require('../middleware/authMiddleware');
const User   = require('../models/User');
const SosLog = require('../models/SosLog');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

function normalisePhone(raw) {
  return String(raw || '').replace(/[\s\-().]/g, '');
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── Twilio SMS ───────────────────────────────────────────────────────────────
async function sendSMS(to, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.warn('[SOS] Twilio env vars not set — SMS skipped.');
    return { skipped: true };
  }

  const url         = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const credentials = Buffer.from(`${sid}:${token}`).toString('base64');
  const params      = new URLSearchParams({ To: to, From: from, Body: body });

  const res  = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio error ${data.code}: ${data.message}`);
  return data;
}

function buildSOSMessage(userName, lat, lng) {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  return (
    `🚨 EMERGENCY! ${userName} needs help.\n` +
    `📍 Live location: ${mapsLink}\n` +
    `Please reach them immediately or call 112 (India Emergency).`
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCY CONTACTS  (embedded in User)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/sos/contacts
router.get('/contacts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ msg: 'User not found' });
    // Normalise _id → id for each contact
    const contacts = (user.emergencyContacts || []).map((c) => ({
      id:        c._id.toString(),
      name:      c.name,
      phone:     c.phone,
      createdAt: c.createdAt,
    }));
    res.json(contacts);
  } catch (err) {
    console.error('[sos/contacts GET]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// POST /api/sos/contacts
router.post('/contacts', auth, async (req, res) => {
  const { name, phone } = req.body;

  if (!name?.trim())                    return res.status(400).json({ msg: 'Contact name is required' });
  if (!phone || !PHONE_RE.test(phone))  return res.status(400).json({ msg: 'A valid phone number is required' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.emergencyContacts.length >= 5) {
      return res.status(400).json({ msg: 'Maximum 5 emergency contacts allowed' });
    }

    user.emergencyContacts.push({ name: name.trim(), phone: normalisePhone(phone) });
    await user.save();

    const contact = user.emergencyContacts[user.emergencyContacts.length - 1];
    res.status(201).json({ id: contact._id.toString(), name: contact.name, phone: contact.phone, createdAt: contact.createdAt });
  } catch (err) {
    console.error('[sos/contacts POST]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// PUT /api/sos/contacts/:contactId
router.put('/contacts/:contactId', auth, async (req, res) => {
  const { name, phone } = req.body;

  if (!name?.trim() && !phone) return res.status(400).json({ msg: 'Provide name or phone to update' });
  if (phone && !PHONE_RE.test(phone)) return res.status(400).json({ msg: 'A valid phone number is required' });
  if (!isValidId(req.params.contactId)) return res.status(400).json({ msg: 'Invalid contact ID' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const contact = user.emergencyContacts.id(req.params.contactId);
    if (!contact) return res.status(404).json({ msg: 'Contact not found' });

    if (name?.trim()) contact.name  = name.trim();
    if (phone)        contact.phone = normalisePhone(phone);

    await user.save();
    res.json({ id: contact._id.toString(), name: contact.name, phone: contact.phone, createdAt: contact.createdAt });
  } catch (err) {
    console.error('[sos/contacts PUT]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// DELETE /api/sos/contacts/:contactId
router.delete('/contacts/:contactId', auth, async (req, res) => {
  if (!isValidId(req.params.contactId)) return res.status(400).json({ msg: 'Invalid contact ID' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const contact = user.emergencyContacts.id(req.params.contactId);
    if (!contact) return res.status(404).json({ msg: 'Contact not found' });

    contact.deleteOne();
    await user.save();
    res.json({ msg: 'Contact deleted' });
  } catch (err) {
    console.error('[sos/contacts DELETE]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOS TRIGGER
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/sos/trigger
router.post('/trigger', auth, async (req, res) => {
  const { lat, lng } = req.body;

  if (lat == null || lng == null) return res.status(400).json({ msg: 'lat and lng are required' });

  const latitude  = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (isNaN(latitude) || isNaN(longitude)) return res.status(400).json({ msg: 'lat and lng must be valid numbers' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const contacts = user.emergencyContacts || [];
    if (contacts.length === 0) {
      return res.status(400).json({ msg: 'No emergency contacts found. Please add at least one contact first.' });
    }

    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message  = buildSOSMessage(user.name, latitude, longitude);

    const smsResults = await Promise.allSettled(contacts.map((c) => sendSMS(c.phone, message)));

    const contactsNotified = contacts.map((c, i) => {
      const result = smsResults[i];
      let status = 'failed';
      let error = null;

      if (result.status === 'fulfilled') {
        if (result.value?.skipped) {
          status = 'skipped';
          error = 'Twilio credentials missing';
        } else {
          status = 'sent';
        }
      } else {
        error = result.reason?.message;
      }

      return {
        contactId: c._id.toString(),
        name:      c.name,
        phone:     c.phone,
        status,
        error,
      };
    });

    const sosLog = await SosLog.create({
      userId:           user._id,
      lat:              latitude,
      lng:              longitude,
      mapsLink,
      contactsNotified,
      status:           'active',
    });

    res.status(201).json({
      msg:        'SOS triggered',
      sosLog:     sosLog.toJSON(),
      smsSent:    contactsNotified.filter((c) => c.status === 'sent').length,
      smsFailed:  contactsNotified.filter((c) => c.status === 'failed').length,
      smsSkipped: contactsNotified.filter((c) => c.status === 'skipped').length,
    });
  } catch (err) {
    console.error('[sos/trigger]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATION UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/sos/:sosId/location
router.post('/:sosId/location', auth, async (req, res) => {
  const { lat, lng } = req.body;

  if (lat == null || lng == null) return res.status(400).json({ msg: 'lat and lng are required' });
  if (!isValidId(req.params.sosId)) return res.status(400).json({ msg: 'Invalid SOS ID' });

  try {
    const sosLog = await SosLog.findOne({ _id: req.params.sosId, userId: req.user.id });
    if (!sosLog) return res.status(404).json({ msg: 'SOS session not found' });
    if (sosLog.status !== 'active') return res.status(400).json({ msg: 'SOS session is not active' });

    sosLog.lat           = parseFloat(lat);
    sosLog.lng           = parseFloat(lng);
    sosLog.mapsLink      = `https://maps.google.com/?q=${sosLog.lat},${sosLog.lng}`;
    sosLog.lastUpdatedAt = new Date();
    await sosLog.save();

    res.json({ msg: 'Location updated', mapsLink: sosLog.mapsLink });
  } catch (err) {
    console.error('[sos/location]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STOP SOS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/sos/:sosId/stop
router.post('/:sosId/stop', auth, async (req, res) => {
  if (!isValidId(req.params.sosId)) return res.status(400).json({ msg: 'Invalid SOS ID' });

  try {
    const sosLog = await SosLog.findOne({ _id: req.params.sosId, userId: req.user.id });
    if (!sosLog) return res.status(404).json({ msg: 'SOS session not found' });

    sosLog.status    = 'stopped';
    sosLog.stoppedAt = new Date();
    await sosLog.save();

    res.json({ msg: 'SOS stopped', sosLog: sosLog.toJSON() });
  } catch (err) {
    console.error('[sos/stop]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOS HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/sos/history
router.get('/history', auth, async (req, res) => {
  try {
    const logs = await SosLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(logs.map((l) => l.toJSON()));
  } catch (err) {
    console.error('[sos/history]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
