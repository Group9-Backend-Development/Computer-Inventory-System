async function generate(req, res) {
  res.status(501).json({ error: 'Not implemented: POST /api/keys' });
}

async function list(req, res) {
  res.status(501).json({ error: 'Not implemented: GET /api/keys' });
}

async function revoke(req, res) {
  res.status(501).json({ error: 'Not implemented: DELETE /api/keys/:id' });
}

module.exports = { generate, list, revoke };
