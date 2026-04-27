const { test } = require('node:test');
const assert = require('node:assert');

const { buildAssignmentHistory } = require('../../src/services/transaction.service');

test('buildAssignmentHistory pairs checkout and checkin events', () => {
  const transactions = [
    {
      id: 'checkout-1',
      type: 'checkout',
      assigneeName: 'tech@example.com',
      createdAt: new Date('2026-04-01T08:00:00Z'),
      createdAtLabel: 'Apr 1, 2026, 8:00 AM',
      documentUrl: '/documents/checkout.pdf',
      documentName: 'checkout.pdf',
      note: 'Assigned for deployment',
    },
    {
      id: 'checkin-1',
      type: 'checkin',
      assigneeName: 'tech@example.com',
      createdAt: new Date('2026-04-03T10:30:00Z'),
      createdAtLabel: 'Apr 3, 2026, 10:30 AM',
      documentUrl: '/documents/checkin.pdf',
      documentName: 'checkin.pdf',
      note: 'Returned in good condition',
    },
  ];

  const assignments = buildAssignmentHistory(transactions);

  assert.strictEqual(assignments.length, 1);
  assert.strictEqual(assignments[0].assigneeName, 'tech@example.com');
  assert.strictEqual(assignments[0].statusLabel, 'Completed');
  assert.strictEqual(assignments[0].checkoutDocumentUrl, '/documents/checkout.pdf');
  assert.strictEqual(assignments[0].checkinDocumentUrl, '/documents/checkin.pdf');
});

test('buildAssignmentHistory keeps active checkout sessions open', () => {
  const transactions = [
    {
      id: 'checkout-2',
      type: 'checkout',
      assigneeName: 'admin@example.com',
      createdAt: new Date('2026-04-20T09:00:00Z'),
      createdAtLabel: 'Apr 20, 2026, 9:00 AM',
      documentUrl: null,
      documentName: null,
      note: '',
    },
  ];

  const assignments = buildAssignmentHistory(transactions);

  assert.strictEqual(assignments.length, 1);
  assert.strictEqual(assignments[0].statusLabel, 'Active');
  assert.strictEqual(assignments[0].checkedInAt, null);
  assert.ok(assignments[0].durationLabel);
});
