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

async function webLoginCookie() {
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'admin@example.com', password: 'admin123', next: '/' }).toString(),
    redirect: 'manual',
  });
  assert.strictEqual(loginRes.status, 302);
  const raw = loginRes.headers.get('set-cookie');
  return raw ? raw.split(',').map((c) => c.split(';')[0].trim()).join('; ') : '';
}

test('GET /reports renders summaries and aging', async () => {
  const cookie = await webLoginCookie();
  const res = await fetch(`${baseUrl}/reports`, { headers: { cookie } });
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('Inventory'));
  assert.ok(html.includes('Aging assets'));
  assert.ok(html.includes('Total tracked assets'));
});

test('GET /reports user audit shows assigned assets for technician', async () => {
  const cookie = await webLoginCookie();
  const res = await fetch(`${baseUrl}/reports?userId=u-tech`, { headers: { cookie } });
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('ITM-002'), 'mock store has In-Use item 2 assigned to u-tech');
  assert.ok(html.includes('value="u-tech" selected'), 'selected user preserved in form');
});
