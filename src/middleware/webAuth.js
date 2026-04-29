const { verifyAccessToken } = require('../utils/jwt');

const COOKIE_NAME = 'access_token';

function jwtExpiresSeconds() {
  const raw = process.env.JWT_EXPIRES_IN || '8h';
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }
  const match = /^(\d+)(h|m|s|d)$/i.exec(raw);
  if (!match) {
    return 8 * 60 * 60;
  }
  const n = Number(match[1]);
  const u = match[2].toLowerCase();
  if (u === 'h') {
    return n * 3600;
  }
  if (u === 'm') {
    return n * 60;
  }
  if (u === 'd') {
    return n * 86400;
  }
  return n;
}

function cookieOptionsBase() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

function setAuthCookie(res, token) {
  const maxAge = jwtExpiresSeconds() * 1000;
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptionsBase(),
    maxAge,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptionsBase());
}

function safeNextPath(raw) {
  if (!raw || typeof raw !== 'string') {
    return '/';
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/';
  }
  return trimmed;
}

function loadWebUser(req, res, next) {
  res.locals.currentUser = null;
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return next();
  }
  try {
    const payload = verifyAccessToken(token);
    res.locals.currentUser = {
      id: payload.sub,
      role: payload.role,
      email: payload.email || '',
    };
    return next();
  } catch {
    clearAuthCookie(res);
    return next();
  }
}

function redirectIfLoggedIn(req, res, next) {
  if (!res.locals.currentUser) {
    return next();
  }
  let path = safeNextPath(typeof req.query.next === 'string' ? req.query.next : '');
  if (path === '/login') {
    path = '/';
  }
  return res.redirect(path);
}

function requireWebAuth(req, res, next) {
  if (res.locals.currentUser) {
    return next();
  }
  const dest = req.originalUrl || req.url || '/';
  const qs = `/login?next=${encodeURIComponent(dest)}`;
  return res.redirect(qs);
}

module.exports = {
  COOKIE_NAME,
  clearAuthCookie,
  loadWebUser,
  redirectIfLoggedIn,
  requireWebAuth,
  safeNextPath,
  setAuthCookie,
};
