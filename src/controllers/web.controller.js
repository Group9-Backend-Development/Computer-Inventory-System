const itemService = require('../services/item.service');
const userService = require('../services/user.service');
const bcrypt = require('bcrypt');

function home(req, res) {
  res.render('home', { title: 'Dashboard' });
}

function loginForm(req, res) {
  res.render('auth/login', { title: 'Sign in' });
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

    res.render('items/detail', { title: 'Item detail', item });
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

function itemsHistory(req, res) {
  res.render('items/history', { title: 'Item history', id: req.params.id });
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

    if (!email || !password || !role) {
      return res.status(400).render('users/form', {
        title: 'New user',
        user: { email, role },
        error: 'Email, password, and role are required.',
      });
    }

    if (!['admin', 'technician'].includes(role)) {
      return res.status(400).render('users/form', {
        title: 'New user',
        user: { email, role },
        error: 'Role must be admin or technician.',
      });
    }

    const existingUser = await userService.findUserByEmail(email);

    if (existingUser) {
      return res.status(409).render('users/form', {
        title: 'New user',
        user: { email, role },
        error: 'Email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await userService.createUser({
      email,
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
    return res.render('users/index', { title: 'Users', users });
  } catch (error) {
    return next(error);
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

function reportsIndex(req, res) {
  res.render('reports/index', { title: 'Reports' });
}

function transactionsCheckout(req, res) {
  res.render('transactions/checkout', { title: 'Checkout item' });
}

function transactionsCheckin(req, res) {
  res.render('transactions/checkin', { title: 'Checkin item' });
}

module.exports = {
  home,
  loginForm,
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
};