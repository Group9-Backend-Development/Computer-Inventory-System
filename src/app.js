const path = require('path');
const express = require('express');
const hbs = require('hbs');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { globalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { navSectionMiddleware } = require('./middleware/navSection');
const { loadWebUser } = require('./middleware/webAuth');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const keysRoutes = require('./routes/keys.routes');
const itemsRoutes = require('./routes/items.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const webRoutes = require('./routes/web.routes');

const app = express();

const viewsPath = path.join(__dirname, '..', 'views');
const publicPath = path.join(__dirname, '..', 'public');

app.set('view engine', 'hbs');
app.set('views', viewsPath);
app.set('view options', { layout: 'layouts/main' });
app.set('view cache', false);
hbs.registerPartials(path.join(viewsPath, 'partials'));
hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

app.use(globalLimiter);
app.use(morgan('combined'));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || false,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loadWebUser);
app.use(express.static(publicPath));

app.use(navSectionMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/', webRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
