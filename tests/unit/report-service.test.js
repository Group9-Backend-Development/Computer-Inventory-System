const { test } = require('node:test');
const assert = require('node:assert');

process.env.USE_MOCK_DATA = 'true';

const reportService = require('../../src/services/report.service');

test('listCurrentAssetsForUser returns currently checked out assets for a user', async () => {
  const assets = await reportService.listCurrentAssetsForUser('u-tech');

  assert.strictEqual(assets.length, 1);
  assert.strictEqual(assets[0].itemId, 'ITM-002');
  assert.strictEqual(assets[0].assigneeName, 'tech@example.com');
});

test('listCurrentAssetsForUser returns no assets for a user without an open checkout', async () => {
  const assets = await reportService.listCurrentAssetsForUser('u-admin');

  assert.deepStrictEqual(assets, []);
});
