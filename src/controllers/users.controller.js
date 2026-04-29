const userService = require('../services/user.service');
const { hashPassword } = require('../utils/password');

async function create(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !role) {
      return res.status(400).json({
        error: 'email, password, and role are required',
      });
    }

    if (!['admin', 'technician'].includes(role)) {
      return res.status(400).json({
        error: 'role must be admin or technician',
      });
    }

    const existingUser = await userService.findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already exists',
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await userService.createUser({
      email: normalizedEmail,
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