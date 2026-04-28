const path = require('path');

const supabase = require('../config/supabase');
const env = require('../config/env');
const mockStore = require('../data/mockStore');
const itemService = require('./item.service');

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

function documentUrl(documentPath) {
  if (!documentPath) {
    return null;
  }

  if (documentPath.startsWith('/documents/')) {
    return documentPath;
  }

  return `/documents/${path.basename(documentPath)}`;
}

function mapTransaction(row, usersById = {}) {
  const assignee = usersById[row.assignee_id];
  const performer = usersById[row.performed_by_id];
  const url = documentUrl(row.document_path);

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
    documentName: url ? path.basename(url) : null,
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

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, is_enabled')
    .in('id', uniqueIds);

  if (error) {
    throw error;
  }

  return Object.fromEntries(data.map((user) => [user.id, user]));
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

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, is_enabled')
    .eq('is_enabled', true)
    .order('email', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map((user) => ({
    _id: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    isEnabled: user.is_enabled,
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

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const usersById = await fetchUsersByIds(
    data.flatMap((transaction) => [transaction.assignee_id, transaction.performed_by_id])
  );

  return data.map((transaction) => mapTransaction(transaction, usersById));
}

function getOpenCheckout(transactions) {
  for (let index = transactions.length - 1; index >= 0; index -= 1) {
    const transaction = transactions[index];

    if (transaction.type === 'checkin') {
      return null;
    }

    if (transaction.type === 'checkout') {
      return transaction;
    }
  }

  return null;
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

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      item_id: itemId,
      type: 'checkout',
      assignee_id: assigneeId,
      performed_by_id: performedById,
      document_path: documentPath,
      note,
    })
    .select()
    .single();

  if (error) {
    await itemService.updateItemStatus(itemId, 'Available', 'In-Use');
    throw error;
  }

  const usersById = await fetchUsersByIds([assigneeId, performedById]);
  return { item: updatedItem, transaction: mapTransaction(data, usersById) };
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

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      item_id: itemId,
      type: 'checkin',
      assignee_id: openCheckout.assigneeId,
      performed_by_id: performedById,
      document_path: documentPath,
      note,
    })
    .select()
    .single();

  if (error) {
    await itemService.updateItemStatus(itemId, 'In-Use', 'Available');
    throw error;
  }

  const usersById = await fetchUsersByIds([openCheckout.assigneeId, performedById]);
  return { item: updatedItem, transaction: mapTransaction(data, usersById) };
}

module.exports = {
  buildAssignmentHistory,
  checkinItem,
  checkoutItem,
  getOpenCheckout,
  listHistoryForItem,
  listUsers,
};
