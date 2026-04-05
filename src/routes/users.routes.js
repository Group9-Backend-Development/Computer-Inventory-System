const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const usersController = require('../controllers/users.controller');

const router = express.Router();

router.post('/', requireAuth, requireRole('admin'), usersController.create);
router.patch('/:id/role', requireAuth, requireRole('admin'), usersController.updateRole);
router.patch('/:id/status', requireAuth, requireRole('admin'), usersController.updateStatus);

module.exports = router;
