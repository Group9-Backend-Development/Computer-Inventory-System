const env = require('../config/env');
const mockStore = require('../data/mockStore');
const itemService = require('./item.service');
const transactionService = require('./transaction.service');

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

  const items = await itemService.listActiveItems();
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

async function listAssetsOlderThanThreeYears() {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);

  if (env.useMockData) {
    return mockStore.clone(
      mockStore.items
        .filter((item) => !item.isDeleted && item.dateAcquired && new Date(item.dateAcquired) < cutoff)
        .sort((a, b) => new Date(a.dateAcquired) - new Date(b.dateAcquired))
    );
  }

  const items = await itemService.listActiveItems();

  return items
    .filter((item) => item.dateAcquired && new Date(item.dateAcquired) < cutoff)
    .sort((a, b) => new Date(a.dateAcquired) - new Date(b.dateAcquired));
}

async function listCurrentAssetsForUser(userId) {
  if (!userId) {
    return [];
  }

  const items = await itemService.listActiveItems();
  const assignedItems = [];

  for (const item of items) {
    if (item.status !== 'In-Use') {
      continue;
    }

    const transactions = await transactionService.listHistoryForItem(item._id);
    const openCheckout = transactionService.getOpenCheckout(transactions);

    if (openCheckout?.assigneeId === userId) {
      assignedItems.push({
        ...item,
        checkedOutAt: openCheckout.createdAtLabel,
        durationLabel: transactionService.formatDuration(openCheckout.createdAt),
        checkoutDocumentUrl: openCheckout.documentUrl,
        checkoutDocumentName: openCheckout.documentName,
      });
    }
  }

  return assignedItems.sort((a, b) => a.itemId.localeCompare(b.itemId));
}

module.exports = {
  inventoryStatusSummary,
  listAssetsOlderThanThreeYears,
  listCurrentAssetsForUser,
};
