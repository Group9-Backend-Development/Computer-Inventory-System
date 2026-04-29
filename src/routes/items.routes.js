const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validateApiKey, requireJwtOrApiKey } = require('../middleware/apiKey');
const { requireRole } = require('../middleware/rbac');
const itemsController = require('../controllers/items.controller');

const router = express.Router();

const jwtOrApiKey = requireJwtOrApiKey(requireAuth, validateApiKey);

router.get('/', jwtOrApiKey, itemsController.list);
router.get('/:id/history', requireAuth, itemsController.history);
router.get('/:id', jwtOrApiKey, itemsController.getById);
router.post('/', requireAuth, itemsController.create);
router.put('/:id', requireAuth, itemsController.update);
router.delete('/:id', requireAuth, requireRole('admin'), itemsController.remove);

module.exports = router;
