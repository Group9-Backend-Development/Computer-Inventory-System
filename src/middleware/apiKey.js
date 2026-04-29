const crypto = require('crypto');
const env = require('../config/env');
const mockStore = require('../data/mockStore');
const supabase = require('../config/supabase');

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

    const { data: record, error: keyErr } = await supabase
      .from('api_keys')
      .select('id, created_by_id, is_revoked')
      .eq('key_hash', keyHash)
      .eq('is_revoked', false)
      .maybeSingle();

    if (keyErr) {
      throw keyErr;
    }
    if (!record) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { data: creator, error: userErr } = await supabase
      .from('users')
      .select('id, is_enabled')
      .eq('id', record.created_by_id)
      .maybeSingle();

    if (userErr) {
      throw userErr;
    }
    if (!creator || !creator.is_enabled) {
      return res.status(401).json({ error: 'API key owner is disabled' });
    }

    req.apiKey = { id: record.id };
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
