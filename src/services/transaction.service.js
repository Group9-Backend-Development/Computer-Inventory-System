const Transaction = require('../models/Transaction');

async function listHistoryForItem(itemId) {
  return Transaction.find({ item: itemId }).sort({ createdAt: -1 }).lean();
}

module.exports = {
  listHistoryForItem,
};
