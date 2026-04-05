function home(req, res) {
  res.render('home', { title: 'Dashboard' });
}

function loginForm(req, res) {
  res.render('auth/login', { title: 'Sign in' });
}

function itemsIndex(req, res) {
  res.render('items/index', { title: 'Inventory items' });
}

function itemsNew(req, res) {
  res.render('items/form', { title: 'New item', item: null });
}

function itemsEdit(req, res) {
  res.render('items/form', { title: 'Edit item', item: { id: req.params.id } });
}

function itemsDetail(req, res) {
  res.render('items/detail', { title: 'Item detail', id: req.params.id });
}

function itemsHistory(req, res) {
  res.render('items/history', { title: 'Item history', id: req.params.id });
}

function usersIndex(req, res) {
  res.render('users/index', { title: 'Users' });
}

function usersNew(req, res) {
  res.render('users/form', { title: 'New user' });
}

function keysIndex(req, res) {
  res.render('keys/index', { title: 'API keys' });
}

function reportsIndex(req, res) {
  res.render('reports/index', { title: 'Reports' });
}

function transactionsCheckout(req, res) {
  res.render('transactions/checkout', { title: 'Check out item' });
}

function transactionsCheckin(req, res) {
  res.render('transactions/checkin', { title: 'Check in item' });
}

module.exports = {
  home,
  loginForm,
  itemsIndex,
  itemsNew,
  itemsEdit,
  itemsDetail,
  itemsHistory,
  usersIndex,
  usersNew,
  keysIndex,
  reportsIndex,
  transactionsCheckout,
  transactionsCheckin,
};
