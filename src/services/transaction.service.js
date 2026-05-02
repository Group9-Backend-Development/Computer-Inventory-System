const env = require('../config/env');
const mockStore = require('../data/mockStore');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const itemService = require('./item.service');
const documentService = require('./document.service');
const { toObjectId } = require('../utils/objectId');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDuration(start, end = new Date()) {
  const startedAt = new Date(start);
  const endedAt = new Date(end);
  const totalHours = Math.max(0, Math.round((endedAt - startedAt) / (1000 * 60 * 60)));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days && hours) {
    return `${days} day${days === 1 ? '' : 's'}, ${hours} hour${hours === 1 ? '' : 's'}`;
  }

  if (days) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

function transactionRowFromLean(doc) {
  const itemRef = doc.item?._id != null ? doc.item._id : doc.item;
  const assigneeRef = doc.assignee?._id != null ? doc.assignee._id : doc.assignee;
  const performedRef = doc.performedBy?._id != null ? doc.performedBy._id : doc.performedBy;

  return {
    id: String(doc._id),
    item_id: String(itemRef),
    type: doc.type,
    assignee_id: assigneeRef ? String(assigneeRef) : null,
    performed_by_id: String(performedRef),
    document_path: doc.documentPath,
    note: doc.note || '',
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  };
}

function mapTransaction(row, usersById = {}) {
  const assignee = usersById[row.assignee_id];
  const performer = usersById[row.performed_by_id];
  const url = documentService.documentUrl(row.document_path);

  return {
    id: row.id,
    itemId: row.item_id,
    type: row.type,
    assigneeId: row.assignee_id,
    assigneeName: assignee ? assignee.email : row.assignee_id || '',
    performedById: row.performed_by_id,
    performedByName: performer ? performer.email : row.performed_by_id || '',
    documentPath: row.document_path,
    documentUrl: url,
    documentName: documentService.documentName(row.document_path),
    note: row.note || '',
    createdAt: row.created_at,
    createdAtLabel: formatDate(row.created_at),
    updatedAt: row.updated_at,
  };
}

async function fetchUsersByIds(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (!uniqueIds.length) {
    return {};
  }

  if (env.useMockData) {
    return Object.fromEntries(
      mockStore.users
        .filter((user) => uniqueIds.includes(user.id))
        .map((user) => [user.id, user])
    );
  }

  const oids = uniqueIds.map(toObjectId).filter(Boolean);
  if (!oids.length) {
    return {};
  }

  const rows = await User.find({ _id: { $in: oids } })
    .select('email role isEnabled')
    .lean();

  return Object.fromEntries(
    rows.map((user) => [
      String(user._id),
      {
        id: String(user._id),
        email: user.email,
        role: user.role,
        is_enabled: user.isEnabled,
      },
    ])
  );
}

async function listUsers() {
  if (env.useMockData) {
    return mockStore.clone(
      mockStore.users
        .filter((user) => user.isEnabled)
        .sort((a, b) => a.email.localeCompare(b.email))
        .map((user) => ({
          _id: user.id,
          id: user.id,
          email: user.email,
          role: user.role,
          isEnabled: user.isEnabled,
        }))
    );
  }

  const data = await User.find({ isEnabled: true }).select('email role isEnabled').sort({ email: 1 }).lean();

  return data.map((user) => ({
    _id: String(user._id),
    id: String(user._id),
    email: user.email,
    role: user.role,
    isEnabled: user.isEnabled,
  }));
}

async function listHistoryForItem(itemId) {
  if (env.useMockData) {
    const data = mockStore.transactions
      .filter((transaction) => transaction.item_id === itemId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const usersById = await fetchUsersByIds(
      data.flatMap((transaction) => [transaction.assignee_id, transaction.performed_by_id])
    );

    return data.map((transaction) => mapTransaction(transaction, usersById));
  }

  const oid = toObjectId(itemId);
  if (!oid) {
    return [];
  }

  const docs = await Transaction.find({ item: oid }).sort({ createdAt: 1 }).lean();
  const rows = docs.map(transactionRowFromLean);
  const usersById = await fetchUsersByIds(
    rows.flatMap((transaction) => [transaction.assignee_id, transaction.performed_by_id])
  );

  return rows.map((transaction) => mapTransaction(transaction, usersById));
}

function getOpenCheckout(transactions) {
  let open = null;
  for (const transaction of transactions) {
    if (transaction.type === 'checkout') {
      open = transaction;
    } else if (transaction.type === 'checkin') {
      open = null;
    }
  }
  return open;
}

function buildAssignmentHistory(transactions) {
  const assignments = [];
  let openCheckout = null;

  for (const transaction of transactions) {
    if (transaction.type === 'checkout') {
      if (openCheckout) {
        assignments.push({
          id: openCheckout.id,
          assigneeName: openCheckout.assigneeName,
          checkedOutAt: openCheckout.createdAtLabel,
          checkedInAt: null,
          durationLabel: formatDuration(openCheckout.createdAt),
          statusLabel: 'Active',
          checkoutDocumentUrl: openCheckout.documentUrl,
          checkoutDocumentName: openCheckout.documentName,
          checkinDocumentUrl: null,
          checkinDocumentName: null,
          checkoutNote: openCheckout.note,
          checkinNote: '',
        });
      }

      openCheckout = transaction;
      continue;
    }

    if (transaction.type === 'checkin' && openCheckout) {
      assignments.push({
        id: `${openCheckout.id}-${transaction.id}`,
        assigneeName: openCheckout.assigneeName,
        checkedOutAt: openCheckout.createdAtLabel,
        checkedInAt: transaction.createdAtLabel,
        durationLabel: formatDuration(openCheckout.createdAt, transaction.createdAt),
        statusLabel: 'Completed',
        checkoutDocumentUrl: openCheckout.documentUrl,
        checkoutDocumentName: openCheckout.documentName,
        checkinDocumentUrl: transaction.documentUrl,
        checkinDocumentName: transaction.documentName,
        checkoutNote: openCheckout.note,
        checkinNote: transaction.note,
      });
      openCheckout = null;
    }
  }

  if (openCheckout) {
    assignments.push({
      id: openCheckout.id,
      assigneeName: openCheckout.assigneeName,
      checkedOutAt: openCheckout.createdAtLabel,
      checkedInAt: null,
      durationLabel: formatDuration(openCheckout.createdAt),
      statusLabel: 'Active',
      checkoutDocumentUrl: openCheckout.documentUrl,
      checkoutDocumentName: openCheckout.documentName,
      checkinDocumentUrl: null,
      checkinDocumentName: null,
      checkoutNote: openCheckout.note,
      checkinNote: '',
    });
  }

  return assignments.reverse();
}

async function checkoutItem({ itemId, assigneeId, performedById, documentPath, note }) {
  if (!itemId || !assigneeId || !performedById || !documentPath) {
    throw createHttpError(400, 'Item, assignee, performer, and reference document are required');
  }

  const updatedItem = await itemService.updateItemStatus(itemId, 'In-Use', 'Available');

  if (!updatedItem) {
    const item = await itemService.findActiveItemById(itemId);
    throw createHttpError(item ? 409 : 404, item ? 'Only available items can be checked out' : 'Item not found');
  }

  if (env.useMockData) {
    const transaction = {
      id: mockStore.nextId('txn', mockStore.transactions),
      item_id: itemId,
      type: 'checkout',
      assignee_id: assigneeId,
      performed_by_id: performedById,
      document_path: documentPath,
      note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.transactions.push(transaction);
    const usersById = await fetchUsersByIds([assigneeId, performedById]);
    return { item: updatedItem, transaction: mapTransaction(transaction, usersById) };
  }

  const itemOid = toObjectId(itemId);
  const assigneeOid = toObjectId(assigneeId);
  const performedOid = toObjectId(performedById);
  if (!itemOid || !assigneeOid || !performedOid) {
    await itemService.updateItemStatus(itemId, 'Available', 'In-Use');
    throw createHttpError(400, 'Invalid item or user id');
  }

  let created;
  try {
    created = await Transaction.create({
      item: itemOid,
      type: 'checkout',
      assignee: assigneeOid,
      performedBy: performedOid,
      documentPath,
      note,
    });
  } catch (err) {
    await itemService.updateItemStatus(itemId, 'Available', 'In-Use');
    throw err;
  }

  const row = transactionRowFromLean(created.toObject());
  const usersById = await fetchUsersByIds([assigneeId, performedById]);
  return { item: updatedItem, transaction: mapTransaction(row, usersById) };
}

async function checkinItem({ itemId, performedById, documentPath, note }) {
  if (!itemId || !performedById || !documentPath) {
    throw createHttpError(400, 'Item, performer, and inspection document are required');
  }

  const history = await listHistoryForItem(itemId);
  const openCheckout = getOpenCheckout(history);

  if (!openCheckout) {
    throw createHttpError(409, 'Item does not have an open checkout');
  }

  const updatedItem = await itemService.updateItemStatus(itemId, 'Available', 'In-Use');

  if (!updatedItem) {
    const item = await itemService.findActiveItemById(itemId);
    throw createHttpError(item ? 409 : 404, item ? 'Only in-use items can be checked in' : 'Item not found');
  }

  if (env.useMockData) {
    const transaction = {
      id: mockStore.nextId('txn', mockStore.transactions),
      item_id: itemId,
      type: 'checkin',
      assignee_id: openCheckout.assigneeId,
      performed_by_id: performedById,
      document_path: documentPath,
      note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.transactions.push(transaction);
    const usersById = await fetchUsersByIds([openCheckout.assigneeId, performedById]);
    return { item: updatedItem, transaction: mapTransaction(transaction, usersById) };
  }

  const itemOid = toObjectId(itemId);
  const assigneeOid = toObjectId(openCheckout.assigneeId);
  const performedOid = toObjectId(performedById);
  if (!itemOid || !assigneeOid || !performedOid) {
    await itemService.updateItemStatus(itemId, 'In-Use', 'Available');
    throw createHttpError(400, 'Invalid item or user id');
  }

  let created;
  try {
    created = await Transaction.create({
      item: itemOid,
      type: 'checkin',
      assignee: assigneeOid,
      performedBy: performedOid,
      documentPath,
      note,
    });
  } catch (err) {
    await itemService.updateItemStatus(itemId, 'In-Use', 'Available');
    throw err;
  }

  const row = transactionRowFromLean(created.toObject());
  const usersById = await fetchUsersByIds([openCheckout.assigneeId, performedById]);
  return { item: updatedItem, transaction: mapTransaction(row, usersById) };
}

module.exports = {
  buildAssignmentHistory,
  checkinItem,
  checkoutItem,
  formatDuration,
  getOpenCheckout,
  listHistoryForItem,
  listUsers,
};
