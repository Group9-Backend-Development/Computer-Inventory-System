const express = require('express');
const webController = require('../controllers/web.controller');

const router = express.Router();

router.get('/', webController.home);
router.get('/login', webController.loginForm);

router.get('/items/new', webController.itemsNew);
router.get('/items/:id/edit', webController.itemsEdit);
router.get('/items/:id/history', webController.itemsHistory);
router.get('/items/:id', webController.itemsDetail);
router.get('/items', webController.itemsIndex);

router.post('/items', webController.itemsCreate);
router.post('/items/:id/edit', webController.itemsUpdate);
router.post('/items/:id/delete', webController.itemsDelete);

router.get('/users/new', webController.usersNew);
router.get('/users', webController.usersIndex);
router.post('/users', webController.usersCreate);
router.post('/users/:id/role', webController.usersUpdateRole);
router.post('/users/:id/status', webController.usersUpdateStatus);

router.get('/keys', webController.keysIndex);
router.get('/reports', webController.reportsIndex);

router.get('/transactions/checkout', webController.transactionsCheckout);
router.get('/transactions/checkin', webController.transactionsCheckin);

module.exports = router;