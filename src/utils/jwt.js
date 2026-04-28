const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      return 'development-only-secret';
    }
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

function signAccessToken(payload) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  return jwt.sign(payload, getSecret(), { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signAccessToken, verifyAccessToken };
