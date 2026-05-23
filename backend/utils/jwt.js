/**
 * Centralised JWT helpers — DriveCare
 * Both auth.js and authMiddleware.js import from here.
 */
const jwt = require('jsonwebtoken');

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') return null;
  return 'development_only_secret_change_me';
}

function signToken(user) {
  const secret = getJwtSecret();
  if (!secret) return null;
  return jwt.sign(
    { user: { id: user.id, name: user.name, email: user.email } },
    secret,
    { expiresIn: '7d' }
  );
}

module.exports = { getJwtSecret, signToken };
