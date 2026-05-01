const express = require('express');
const webController = require('../controllers/web.controller');
const { uploadSingle } = require('../middleware/upload');
const { redirectIfLoggedIn, requireWebAuth, requireWebAdmin } = require('../middleware/webAuth');

const router = express.Router();

router.get('/login', redirectIfLoggedIn, webController.loginForm);
router.post('/login', webController.loginSubmit);
router.post('/logout', requireWebAuth, webController.logout);

router.use(requireWebAuth);

router.get('/', webController.home);

router.get('/items/new', webController.itemsNew);
router.get('/items/:id/edit', webController.itemsEdit);
router.get('/items/:id/history', webController.itemsHistory);
router.get('/items/:id', webController.itemsDetail);
router.get('/items', webController.itemsIndex);

router.post('/items', webController.itemsCreate);
router.post('/items/:id/edit', webController.itemsUpdate);
router.post('/items/:id/delete', requireWebAdmin, webController.itemsDelete);

router.get('/users/new', requireWebAdmin, webController.usersNew);
router.get('/users', requireWebAdmin, webController.usersIndex);
router.post('/users', requireWebAdmin, webController.usersCreate);
router.post('/users/:id/role', requireWebAdmin, webController.usersUpdateRole);
router.post('/users/:id/status', requireWebAdmin, webController.usersUpdateStatus);

router.post('/keys/generate', requireWebAdmin, webController.keysGenerate);
router.post('/keys/:id/revoke', requireWebAdmin, webController.keysRevoke);
router.get('/keys', requireWebAdmin, webController.keysIndex);

router.get('/reports', webController.reportsIndex);

router.get('/transactions/checkout', webController.transactionsCheckout);
router.get('/transactions/checkin', webController.transactionsCheckin);
router.post('/transactions/checkout', uploadSingle.single('document'), webController.transactionsCheckoutCreate);
router.post('/transactions/checkin', uploadSingle.single('document'), webController.transactionsCheckinCreate);

module.exports = router;
