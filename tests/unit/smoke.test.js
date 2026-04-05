const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

test('package manifest loads', () => {
  const pkg = require(path.join(__dirname, '..', '..', 'package.json'));
  assert.strictEqual(pkg.name, 'computer-inventory-system');
});

test('express app factory loads', () => {
  const app = require('../../src/app');
  assert.ok(typeof app === 'function' || typeof app.handle === 'function');
});
