const userService = require('../services/user.service');

async function create(req, res, next) {
  try {
    const user = await userService.createUser({
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      isEnabled: req.body.isEnabled !== false,
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

async function updateRole(req, res) {
  res.status(501).json({ error: 'Not implemented: PATCH /api/users/:id/role' });
}

async function updateStatus(req, res) {
  res.status(501).json({ error: 'Not implemented: PATCH /api/users/:id/status' });
}

module.exports = { create, updateRole, updateStatus };
