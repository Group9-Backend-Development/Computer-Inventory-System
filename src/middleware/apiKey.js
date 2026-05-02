const env = require('../config/env');
const mockStore = require('../data/mockStore');
const ApiKey = require('../models/ApiKey');
const { hashApiKey } = require('../utils/apiKeyHash');

function hashKey(rawKey) {
  return hashApiKey(rawKey);
}

async function validateApiKey(req, res, next) {
  try {
    const raw = req.headers['x-api-key'];
    if (!raw || typeof raw !== 'string') {
      return res.status(401).json({ error: 'Missing API key' });
    }
    const keyHash = hashKey(raw.trim());

    if (env.useMockData) {
      const record = mockStore.apiKeys.find((k) => k.keyHash === keyHash && !k.isRevoked);
      if (!record) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      const creator = mockStore.users.find((u) => u.id === record.createdBy || u._id === record.createdBy);
      if (!creator || !creator.isEnabled) {
        return res.status(401).json({ error: 'API key owner is disabled' });
      }
      req.apiKey = { id: String(record.id) };
      return next();
    }

    const record = await ApiKey.findOne({ keyHash, isRevoked: false }).populate('createdBy').lean();

    if (!record) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const creator = record.createdBy;
    if (!creator || !creator.isEnabled) {
      return res.status(401).json({ error: 'API key owner is disabled' });
    }

    req.apiKey = { id: String(record._id) };
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
