const itemService = require('../services/item.service');

function home(req, res) {
  res.render('home', { title: 'Dashboard' });
}

function loginForm(req, res) {
  res.render('auth/login', { title: 'Sign in' });
}

async function itemsIndex(req, res, next) {
  try {
    const items = await itemService.listActiveItems();
    res.render('items/index', { title: 'Inventory items', items });
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

    res.redirect('/items');
  } catch (error) {
    next(error);
  }
}

function itemsHistory(req, res) {
  res.render('items/history', { title: 'Item history', id: req.params.id });
}

function usersNew(req, res) {
  res.render('users/form', {
    title: 'New user',
    user: null,
    roles: ['Admin', 'Staff'],
  });
}

function usersIndex(req, res) {
  res.render('users/index', { title: 'Users', users: [] });
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
  usersIndex,
  keysIndex,
  reportsIndex,
  transactionsCheckout,
  transactionsCheckin,
};