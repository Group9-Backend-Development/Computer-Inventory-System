function notFoundHandler(req, res, next) {
  if (req.accepts('html')) {
    return res.status(404).render('errors/not-found', {
      title: 'Not found',
      path: req.originalUrl,
    });
  }
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (req.accepts('html')) {
    return res.status(status).render('errors/error', {
      title: 'Error',
      status,
      message,
    });
  }

  res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
