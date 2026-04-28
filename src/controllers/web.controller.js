const itemService = require('../services/item.service');
const transactionService = require('../services/transaction.service');
const reportService = require('../services/report.service');
const userService = require('../services/user.service');

function uploadedDocumentPath(file) {
  return file ? `/documents/${file.filename}` : null;
}

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

    res.redirect('/items');
  } catch (error) {
    next(error);
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

    res.redirect(`/items/${req.params.id}`);
  } catch (error) {
    next(error);
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

    res.redirect('/items');
  } catch (error) {
    next(error);
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
    roles: ['admin', 'technician'],
  });
}

async function usersIndex(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.render('users/index', { title: 'Users', users });
  } catch (error) {
    next(error);
  }
}

async function usersCreate(req, res, next) {
  try {
    await userService.createUser({
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      isEnabled: req.body.isEnabled === 'on',
    });

    res.redirect('/users');
  } catch (error) {
    next(error);
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
  itemsIndex,
  itemsNew,
  itemsCreate,
  itemsEdit,
  itemsUpdate,
  itemsDetail,
  itemsDelete,
  itemsHistory,
  usersNew,
  usersIndex,
  usersCreate,
  keysIndex,
  reportsIndex,
  transactionsCheckout,
  transactionsCheckin,
  transactionsCheckoutCreate,
  transactionsCheckinCreate,
};
