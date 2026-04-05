const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

async function validateApiKey(req, res, next) {
  try {
    const raw = req.headers['x-api-key'];
    if (!raw || typeof raw !== 'string') {
      return res.status(401).json({ error: 'Missing API key' });
    }
    const keyHash = hashKey(raw.trim());
    const record = await ApiKey.findOne({ keyHash, isRevoked: false });
    if (!record) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    const creator = await User.findById(record.createdBy);
    if (!creator || !creator.isEnabled) {
      return res.status(401).json({ error: 'API key owner is disabled' });
    }
    req.apiKey = { id: record._id.toString() };
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireJwtOrApiKey(requireAuth, validateApiKeyFn) {
  return async (req, res, next) => {
    const hasBearer = req.headers.authorization?.startsWith('Bearer ');
    const hasApiKey = Boolean(req.headers['x-api-key']);
    if (hasApiKey) {
      return validateApiKeyFn(req, res, next);
    }
    if (hasBearer) {
      return requireAuth(req, res, next);
    }
    return res.status(401).json({ error: 'Unauthorized' });
  };
}

module.exports = { validateApiKey, requireJwtOrApiKey, hashKey };
