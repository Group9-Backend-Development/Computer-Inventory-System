const Item = require('../models/Item');
const env = require('../config/env');
const mockStore = require('../data/mockStore');

async function inventoryStatusSummary() {
  if (env.useMockData) {
    const items = mockStore.items.filter((item) => !item.isDeleted);
    const byStatus = {};

    for (const item of items) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    }

    return {
      total: items.length,
      deployed: byStatus['In-Use'] || 0,
      available: byStatus.Available || 0,
      byStatus,
    };
  }

  const items = await Item.find({ isDeleted: false }).select('status').lean();
  const summary = { total: items.length, byStatus: {} };
  for (const row of items) {
    summary.byStatus[row.status] = (summary.byStatus[row.status] || 0) + 1;
  }
  return summary;
}

async function listAssetsOlderThanThreeYears() {
  if (env.useMockData) {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 3);

    return mockStore.clone(
      mockStore.items
        .filter((item) => !item.isDeleted && item.dateAcquired && new Date(item.dateAcquired) < cutoff)
        .sort((a, b) => new Date(a.dateAcquired) - new Date(b.dateAcquired))
    );
  }

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
