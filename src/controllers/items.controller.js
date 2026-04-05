async function list(req, res) {
  res.json([]);
}

async function getById(req, res) {
  res.status(501).json({ error: 'Not implemented: GET /api/items/:id' });
}

async function history(req, res) {
  res.json([]);
}

async function create(req, res) {
  res.status(501).json({ error: 'Not implemented: POST /api/items' });
}

async function update(req, res) {
  res.status(501).json({ error: 'Not implemented: PUT /api/items/:id' });
}

async function remove(req, res) {
  res.status(501).json({ error: 'Not implemented: DELETE /api/items/:id' });
}

module.exports = { list, getById, history, create, update, remove };
