/**
 * Password helpers — DriveCare
 * Centralised so auth.js and profile.js share the same implementation.
 * Uses Node's built-in crypto (no extra dependencies).
 */
const crypto = require('crypto');

/**
 * Hash a plain-text password.
 * Returns "salt:derivedKeyHex"
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key  = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

/**
 * Verify a plain-text password against a stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifyPassword(password, storedHash) {
  const [salt, savedKey] = String(storedHash || '').split(':');
  if (!salt || !savedKey) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const saved   = Buffer.from(savedKey, 'hex');
  return saved.length === derived.length && crypto.timingSafeEqual(saved, derived);
}

module.exports = { hashPassword, verifyPassword };
