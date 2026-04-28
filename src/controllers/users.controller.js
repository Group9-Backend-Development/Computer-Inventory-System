const bcrypt = require('bcrypt');
const userService = require('../services/user.service');

async function create(req, res, next) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        error: 'email, password, and role are required',
      });
    }

    if (!['admin', 'technician'].includes(role)) {
      return res.status(400).json({
        error: 'role must be admin or technician',
      });
    }

    const existingUser = await userService.findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userService.createUser({
      email,
      passwordHash,
      role,
    });

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        error: 'role is required',
      });
    }

    if (!['admin', 'technician'].includes(role)) {
      return res.status(400).json({
        error: 'role must be admin or technician',
      });
    }

    const updatedUser = await userService.updateUserRole(req.params.id, role);

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json(updatedUser);
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { isEnabled } = req.body;

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        error: 'isEnabled must be true or false',
      });
    }

    const updatedUser = await userService.updateUserStatus(
      req.params.id,
      isEnabled
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json(updatedUser);
  } catch (error) {
    return next(error);
  }
}

module.exports = { create, updateRole, updateStatus };