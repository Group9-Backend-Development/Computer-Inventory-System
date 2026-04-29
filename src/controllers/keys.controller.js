const apiKeyService = require('../services/apiKey.service');

async function generate(req, res, next) {
  try {
    const labelRaw = req.body?.label;
    const label = typeof labelRaw === 'string' && labelRaw.trim() ? labelRaw.trim() : null;
    const created = await apiKeyService.createKey(req.user.id, label);
    return res.status(201).json({
      id: created.id,
      label: created.label,
      key: created.plaintextKey,
      createdAt: created.createdAt,
    });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const keys = await apiKeyService.listKeys();
    return res.json(keys);
  } catch (err) {
    return next(err);
  }
}

async function revoke(req, res, next) {
  try {
    await apiKeyService.revokeKey(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { generate, list, revoke };
