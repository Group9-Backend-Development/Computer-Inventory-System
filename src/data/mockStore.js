const bcrypt = require('bcryptjs');

const items = require('./mockItems');

const users = [
  {
    _id: 'u-admin',
    id: 'u-admin',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    isEnabled: true,
    createdAt: '2026-04-01T08:00:00.000Z',
  },
  {
    _id: 'u-tech',
    id: 'u-tech',
    email: 'tech@example.com',
    passwordHash: bcrypt.hashSync('tech123', 10),
    role: 'technician',
    isEnabled: true,
    createdAt: '2026-04-02T08:00:00.000Z',
  },
];

const transactions = [
  {
    id: 'txn-1',
    item_id: '2',
    type: 'checkout',
    assignee_id: 'u-tech',
    performed_by_id: 'u-admin',
    document_path: '/documents/sample-checkout.pdf',
    note: 'Mock checkout for testing history',
    created_at: '2026-04-10T09:00:00.000Z',
    updated_at: '2026-04-10T09:00:00.000Z',
  },
];

const apiKeys = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextId(prefix, collection) {
  return `${prefix}-${collection.length + 1}`;
}

module.exports = {
  apiKeys,
  clone,
  items,
  nextId,
  transactions,
  users,
};
