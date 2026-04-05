const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const transactionsController = require('../controllers/transactions.controller');

const router = express.Router();

router.post(
  '/checkout',
  requireAuth,
  uploadSingle.single('document'),
  transactionsController.checkout
);
router.post(
  '/checkin',
  requireAuth,
  uploadSingle.single('document'),
  transactionsController.checkin
);

module.exports = router;
