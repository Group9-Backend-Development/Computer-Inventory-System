const crypto = require('crypto');

function hashApiKey(raw) {
  return crypto.createHash('sha256').update(String(raw).trim()).digest('hex');
}

module.exports = { hashApiKey };
