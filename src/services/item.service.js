const Item = require('../models/Item');

async function listActiveItems() {
  return Item.find({ isDeleted: false }).sort({ itemId: 1 }).lean();
}

module.exports = {
  listActiveItems,
};
