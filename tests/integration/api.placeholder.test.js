process.env.USE_MOCK_DATA = 'true';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const { after, before, test } = require('node:test');
const assert = require('node:assert');

const app = require('../../src/app');

let server;
let baseUrl;

before(() => {
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

async function login(email, password) {
  const { response, body } = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert.strictEqual(response.status, 200);
  assert.ok(body.token);
  return body.token;
}

test('API auth enforces admin-only user creation', async () => {
  const technicianToken = await login('tech@example.com', 'tech123');

  const { response } = await request('/api/users', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${technicianToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: 'blocked@example.com',
      password: 'password123',
      role: 'technician',
    }),
  });

  assert.strictEqual(response.status, 403);
});

test('admin can generate, list, and revoke API keys', async () => {
  const adminToken = await login('admin@example.com', 'admin123');

  const created = await request('/api/keys', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${adminToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ label: 'integration test' }),
  });

  assert.strictEqual(created.response.status, 201);
  assert.ok(created.body.key.startsWith('cis_'));

  const listedBefore = await request('/api/keys', {
    headers: { authorization: `Bearer ${adminToken}` },
  });

  assert.strictEqual(listedBefore.response.status, 200);
  assert.ok(listedBefore.body.some((key) => key.id === created.body.id));

  const revoked = await request(`/api/keys/${created.body.id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${adminToken}` },
  });

  assert.strictEqual(revoked.response.status, 204);

  const listedAfter = await request('/api/keys', {
    headers: { authorization: `Bearer ${adminToken}` },
  });

  assert.strictEqual(listedAfter.response.status, 200);
  assert.ok(!listedAfter.body.some((key) => key.id === created.body.id));
});

test('checkout and checkin require uploaded documents and update item status', async () => {
  const adminToken = await login('admin@example.com', 'admin123');

  const checkoutForm = new FormData();
  checkoutForm.append('itemId', '1');
  checkoutForm.append('assigneeId', 'u-tech');
  checkoutForm.append('note', 'Integration checkout');
  checkoutForm.append('document', new Blob(['checkout document']), 'checkout.txt');

  const checkedOut = await request('/api/transactions/checkout', {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` },
    body: checkoutForm,
  });

  assert.strictEqual(checkedOut.response.status, 201);
  assert.strictEqual(checkedOut.body.item.status, 'In-Use');

  const checkinForm = new FormData();
  checkinForm.append('itemId', '1');
  checkinForm.append('note', 'Integration return');
  checkinForm.append('document', new Blob(['checkin document']), 'checkin.txt');

  const checkedIn = await request('/api/transactions/checkin', {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` },
    body: checkinForm,
  });

  assert.strictEqual(checkedIn.response.status, 201);
  assert.strictEqual(checkedIn.body.item.status, 'Available');
});
