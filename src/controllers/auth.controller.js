const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'email and password are required',
      });
    }

    const user = await userService.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    if (!user.isEnabled) {
      return res.status(403).json({
        error: 'Account is disabled',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEnabled: user.isEnabled,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login };