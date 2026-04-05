const Item = require('../models/Item');

async function inventoryStatusSummary() {
  const items = await Item.find({ isDeleted: false }).select('status').lean();
  const summary = { total: items.length, byStatus: {} };
  for (const row of items) {
    summary.byStatus[row.status] = (summary.byStatus[row.status] || 0) + 1;
  }
  return summary;
}

async function listAssetsOlderThanThreeYears() {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  return Item.find({
    isDeleted: false,
    dateAcquired: { $lt: cutoff },
  })
    .sort({ dateAcquired: 1 })
    .lean();
}

module.exports = {
  inventoryStatusSummary,
  listAssetsOlderThanThreeYears,
};
