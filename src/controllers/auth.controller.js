const userService = require('../services/user.service');
const { comparePassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userService.findByEmail(email);

    if (!user || !user.isEnabled) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await comparePassword(password || '', user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signAccessToken({ sub: user.id || user._id.toString(), role: user.role });
    return res.json({
      token,
      user: userService.publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login };
