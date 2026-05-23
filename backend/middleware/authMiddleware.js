const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const secret = getJwtSecret();
    if (!secret) {
      return res.status(500).json({ msg: 'JWT_SECRET is not configured' });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded?.user?.id) {
      return res.status(401).json({ msg: 'Token payload is invalid' });
    }

    req.user = decoded.user; // { id, name, email }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token has expired' });
    }
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
