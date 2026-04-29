const userService = require('../services/user.service');
const { comparePassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'email and password are required',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await userService.findUserByEmail(normalizedEmail);

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

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const token = signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

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
