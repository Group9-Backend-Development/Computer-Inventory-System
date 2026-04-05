async function create(req, res) {
  res.status(501).json({ error: 'Not implemented: POST /api/users' });
}

async function updateRole(req, res) {
  res.status(501).json({ error: 'Not implemented: PATCH /api/users/:id/role' });
}

async function updateStatus(req, res) {
  res.status(501).json({ error: 'Not implemented: PATCH /api/users/:id/status' });
}

module.exports = { create, updateRole, updateStatus };
