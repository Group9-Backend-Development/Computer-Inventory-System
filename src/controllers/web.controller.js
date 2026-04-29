const itemService = require('../services/item.service');
const transactionService = require('../services/transaction.service');
const reportService = require('../services/report.service');
const userService = require('../services/user.service');
const { comparePassword, hashPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const { setAuthCookie, clearAuthCookie, safeNextPath } = require('../middleware/webAuth');

function uploadedDocumentPath(file) {
  return file ? `/documents/${file.filename}` : null;
}

function home(req, res) {
  res.render('home', { title: 'Dashboard' });
}

function loginForm(req, res) {
  const nextUrl = safeNextPath(typeof req.query.next === 'string' ? req.query.next : '');
  res.render('auth/login', {
    layout: 'layouts/auth',
    title: 'Sign in',
    next: nextUrl,
    error: null,
    email: '',
  });
}

async function loginSubmit(req, res, next) {
  try {
    const { email, password, next: nextRaw } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await userService.findUserByEmail(normalizedEmail);
    const nextUrl = safeNextPath(typeof nextRaw === 'string' ? nextRaw : '');

    if (!user || !user.isEnabled) {
      return res.status(401).render('auth/login', {
        layout: 'layouts/auth',
        title: 'Sign in',
        next: nextUrl,
        error: 'Invalid email or password.',
        email: normalizedEmail,
      });
    }

    const passwordMatches = await comparePassword(password || '', user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).render('auth/login', {
        layout: 'layouts/auth',
        title: 'Sign in',
        next: nextUrl,
        error: 'Invalid email or password.',
        email: normalizedEmail,
      });
    }

    const token = signAccessToken({
      sub: user.id || user._id?.toString(),
      role: user.role,
      email: user.email,
    });

    setAuthCookie(res, token);
    return res.redirect(nextUrl);
  } catch (err) {
    return next(err);
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  res.redirect('/login');
}

async function itemsIndex(req, res, next) {
  try {
    const items = await itemService.listActiveItems();
    const selectedStatus = req.query.status || '';

    const filteredItems = selectedStatus
      ? items.filter((item) => item.status === selectedStatus)
      : items;

    res.render('items/index', {
      title: 'Inventory items',
      items: filteredItems,
      selectedStatus,
      statuses: ['Available', 'In-Use', 'Maintenance', 'Retired'],
    });
  } catch (error) {
    next(error);
  }
}

function itemsNew(req, res) {
  res.render('items/form', {
    title: 'New item',
    item: null,
    classifications: ['Computer', 'Peripheral'],
    statuses: ['Available', 'In-Use', 'Maintenance', 'Retired'],
  });
}

async function itemsCreate(req, res, next) {
  try {
    const {
      itemId,
      serialNumber,
      model,
      brand,
      classification,
      category,
      status,
      dateAcquired,
    } = req.body;

    await itemService.createItem({
      itemId,
      serialNumber,
      model,
      brand,
      classification,
      category,
      status,
      dateAcquired,
    });

    return res.redirect('/items');
  } catch (error) {
    return next(error);
  }
}

async function itemsEdit(req, res, next) {
  try {
    const item = await itemService.findActiveItemById(req.params.id);

    if (!item) {
      return res.status(404).render('errors/not-found', { title: 'Item not found' });
    }

    if (item.dateAcquired) {
      item.dateAcquired = new Date(item.dateAcquired).toISOString().split('T')[0];
    }

    res.render('items/form', {
      title: 'Edit item',
      item,
      classifications: ['Computer', 'Peripheral'],
      statuses: ['Available', 'In-Use', 'Maintenance', 'Retired'],
    });
  } catch (error) {
    next(error);
  }
}

async function itemsUpdate(req, res, next) {
  try {
    const {
      itemId,
      serialNumber,
      model,
      brand,
      classification,
      category,
      status,
      dateAcquired,
    } = req.body;

    const updatedItem = await itemService.updateItem(req.params.id, {
      itemId,
      serialNumber,
      model,
      brand,
      classification,
      category,
      status,
      dateAcquired,
    });

    if (!updatedItem) {
      return res.status(404).render('errors/not-found', { title: 'Item not found' });
    }

    return res.redirect(`/items/${req.params.id}`);
  } catch (error) {
    return next(error);
  }
}

async function itemsDetail(req, res, next) {
  try {
    const item = await itemService.findActiveItemById(req.params.id);

    if (!item) {
      return res.status(404).render('errors/not-found', { title: 'Item not found' });
    }

    if (item.dateAcquired) {
      item.dateAcquired = new Date(item.dateAcquired).toISOString().split('T')[0];
    }

    const transactions = await transactionService.listHistoryForItem(req.params.id);
    const assignments = transactionService.buildAssignmentHistory(transactions);
    const currentAssignment = assignments.find((assignment) => assignment.statusLabel === 'Active');

    res.render('items/detail', {
      title: 'Item detail',
      item,
      currentAssignment,
      recentTransactions: transactions.slice(-5).reverse(),
      assignments: assignments.slice(0, 3),
    });
  } catch (error) {
    next(error);
  }
}

async function itemsDelete(req, res, next) {
  try {
    const deletedItem = await itemService.softDeleteItem(req.params.id);

    if (!deletedItem) {
      return res.status(404).render('errors/not-found', { title: 'Item not found' });
    }

    return res.redirect('/items');
  } catch (error) {
    return next(error);
  }
}

async function itemsHistory(req, res, next) {
  try {
    const item = await itemService.findActiveItemById(req.params.id);

    if (!item) {
      return res.status(404).render('errors/not-found', { title: 'Item not found' });
    }

    const transactions = await transactionService.listHistoryForItem(req.params.id);
    const assignments = transactionService.buildAssignmentHistory(transactions);

    res.render('items/history', {
      title: 'Item history',
      item,
      transactions: transactions.slice().reverse(),
      assignments,
    });
  } catch (error) {
    next(error);
  }
}

function usersNew(req, res) {
  res.render('users/form', {
    title: 'New user',
    user: null,
  });
}

async function usersCreate(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !role) {
      return res.status(400).render('users/form', {
        title: 'New user',
        user: { email: normalizedEmail, role },
        error: 'Email, password, and role are required.',
      });
    }

    if (!['admin', 'technician'].includes(role)) {
      return res.status(400).render('users/form', {
        title: 'New user',
        user: { email: normalizedEmail, role },
        error: 'Role must be admin or technician.',
      });
    }

    const existingUser = await userService.findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).render('users/form', {
        title: 'New user',
        user: { email: normalizedEmail, role },
        error: 'Email already exists.',
      });
    }

    const passwordHash = await hashPassword(password);

    await userService.createUser({
      email: normalizedEmail,
      passwordHash,
      role,
    });

    return res.redirect('/users');
  } catch (error) {
    return next(error);
  }
}

async function usersIndex(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.render('users/index', { title: 'Users', users });
  } catch (error) {
    next(error);
  }
}

async function usersUpdateRole(req, res, next) {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'technician'].includes(role)) {
      return res.status(400).render('errors/not-found', { title: 'Invalid role' });
    }

    const updatedUser = await userService.updateUserRole(req.params.id, role);

    if (!updatedUser) {
      return res.status(404).render('errors/not-found', { title: 'User not found' });
    }

    return res.redirect('/users');
  } catch (error) {
    return next(error);
  }
}

async function usersUpdateStatus(req, res, next) {
  try {
    const isEnabled = req.body.isEnabled === 'true';

    const updatedUser = await userService.updateUserStatus(req.params.id, isEnabled);

    if (!updatedUser) {
      return res.status(404).render('errors/not-found', { title: 'User not found' });
    }

    return res.redirect('/users');
  } catch (error) {
    return next(error);
  }
}

function keysIndex(req, res) {
  res.render('keys/index', { title: 'API keys', keys: [] });
}

async function reportsIndex(req, res, next) {
  try {
    const [inventorySummary, agingItems] = await Promise.all([
      reportService.inventoryStatusSummary(),
      reportService.listAssetsOlderThanThreeYears(),
    ]);

    res.render('reports/index', {
      title: 'Reports',
      inventorySummary,
      agingItems,
    });
  } catch (error) {
    next(error);
  }
}

async function transactionsCheckout(req, res, next) {
  try {
    const [items, users] = await Promise.all([
      itemService.listActiveItems(),
      transactionService.listUsers(),
    ]);

    res.render('transactions/checkout', {
      title: 'Checkout item',
      items: items.filter((item) => item.status === 'Available'),
      users,
    });
  } catch (error) {
    next(error);
  }
}

async function transactionsCheckin(req, res, next) {
  try {
    const [items, users] = await Promise.all([
      itemService.listActiveItems(),
      transactionService.listUsers(),
    ]);

    res.render('transactions/checkin', {
      title: 'Checkin item',
      items: items.filter((item) => item.status === 'In-Use'),
      users,
    });
  } catch (error) {
    next(error);
  }
}

async function transactionsCheckoutCreate(req, res, next) {
  try {
    await transactionService.checkoutItem({
      itemId: req.body.itemId,
      assigneeId: req.body.assigneeId,
      performedById: req.body.performedById,
      documentPath: uploadedDocumentPath(req.file),
      note: req.body.note,
    });

    res.redirect(`/items/${req.body.itemId}/history`);
  } catch (error) {
    next(error);
  }
}

async function transactionsCheckinCreate(req, res, next) {
  try {
    await transactionService.checkinItem({
      itemId: req.body.itemId,
      performedById: req.body.performedById,
      documentPath: uploadedDocumentPath(req.file),
      note: req.body.note,
    });

    res.redirect(`/items/${req.body.itemId}/history`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  home,
  loginForm,
  loginSubmit,
  logout,
  itemsIndex,
  itemsNew,
  itemsCreate,
  itemsEdit,
  itemsUpdate,
  itemsDetail,
  itemsDelete,
  itemsHistory,
  usersNew,
  usersCreate,
  usersIndex,
  usersUpdateRole,
  usersUpdateStatus,
  keysIndex,
  reportsIndex,
  transactionsCheckout,
  transactionsCheckin,
  transactionsCheckoutCreate,
  transactionsCheckinCreate,
};