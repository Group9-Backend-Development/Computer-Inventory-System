function navSectionMiddleware(req, res, next) {
  const p = req.path || '';

  if (p === '/') {
    res.locals.navSection = 'home';
    return next();
  }
  if (p.startsWith('/items')) {
    res.locals.navSection = 'items';
    return next();
  }
  if (p.startsWith('/transactions/checkout')) {
    res.locals.navSection = 'checkout';
    return next();
  }
  if (p.startsWith('/transactions/checkin')) {
    res.locals.navSection = 'checkin';
    return next();
  }
  if (p.startsWith('/reports')) {
    res.locals.navSection = 'reports';
    return next();
  }
  if (p.startsWith('/users')) {
    res.locals.navSection = 'users';
    return next();
  }
  if (p.startsWith('/keys')) {
    res.locals.navSection = 'keys';
    return next();
  }
  if (p.startsWith('/login')) {
    res.locals.navSection = 'login';
    return next();
  }

  res.locals.navSection = '';
  return next();
}

module.exports = { navSectionMiddleware };
