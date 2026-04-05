const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const keysController = require('../controllers/keys.controller');

const router = express.Router();

router.post('/', requireAuth, requireRole('admin'), keysController.generate);
router.get('/', requireAuth, requireRole('admin'), keysController.list);
router.delete('/:id', requireAuth, requireRole('admin'), keysController.revoke);

module.exports = router;
