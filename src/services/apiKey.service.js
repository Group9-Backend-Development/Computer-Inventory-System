const crypto = require('crypto');

const env = require('../config/env');
const mockStore = require('../data/mockStore');
const ApiKey = require('../models/ApiKey');
const { hashApiKey } = require('../utils/apiKeyHash');
const { toObjectId } = require('../utils/objectId');

function generateRawKey() {
  const suffix = crypto.randomBytes(32).toString('base64url');
  return `cis_${suffix}`;
}

function rowStatus(isRevoked) {
  if (isRevoked === true || isRevoked === 1 || isRevoked === 't' || isRevoked === 'true') {
    return 'revoked';
  }
  return 'active';
}

function compareKeysUi(a, b) {
  const rank = { active: 0, revoked: 1 };
  const ra = rank[a.status] ?? 9;
  const rb = rank[b.status] ?? 9;
  if (ra !== rb) {
    return ra - rb;
  }
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  return tb - ta;
}

function sortKeysForUi(rows) {
  return [...rows].sort(compareKeysUi);
}

async function createKey(createdByUserId, label) {
  const plaintextKey = generateRawKey();
  const keyHash = hashApiKey(plaintextKey);

  if (env.useMockData) {
    const id = mockStore.nextId('key', mockStore.apiKeys);
    const record = {
      id,
      keyHash,
      label: label || null,
      createdBy: createdByUserId,
      isRevoked: false,
      createdAt: new Date().toISOString(),
    };
    mockStore.apiKeys.push(record);
    return {
      id,
      label: record.label,
      plaintextKey,
      createdAt: record.createdAt,
    };
  }

  const creatorOid = toObjectId(createdByUserId);
  if (!creatorOid) {
    const err = new Error('Invalid user id');
    err.status = 400;
    throw err;
  }

  const created = await ApiKey.create({
    keyHash,
    label: label || null,
    createdBy: creatorOid,
    isRevoked: false,
  });

  return {
    id: String(created._id),
    label: created.label,
    plaintextKey,
    createdAt: created.createdAt.toISOString(),
  };
}

async function listKeys({ includeRevoked = false } = {}) {
  if (env.useMockData) {
    const mapped = mockStore.apiKeys.map((row) => {
      const creator = mockStore.users.find((u) => u.id === row.createdBy || u._id === row.createdBy);
      return {
        id: row.id,
        label: row.label,
        status: rowStatus(row.isRevoked),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt || null,
        creatorEmail: creator ? creator.email : '',
      };
    });
    return sortKeysForUi(includeRevoked ? mapped : mapped.filter((row) => row.status === 'active'));
  }

  const rows = await ApiKey.find()
    .populate('createdBy', 'email')
    .sort({ createdAt: -1 })
    .lean();

  if (!rows.length) {
    return [];
  }

  const mapped = rows.map((r) => ({
    id: String(r._id),
    label: r.label,
    status: rowStatus(r.isRevoked),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    creatorEmail: r.createdBy && typeof r.createdBy === 'object' ? r.createdBy.email || '' : '',
  }));

  return sortKeysForUi(includeRevoked ? mapped : mapped.filter((row) => row.status === 'active'));
}

async function revokeKey(id) {
  if (env.useMockData) {
    const row = mockStore.apiKeys.find((k) => k.id === id);
    if (!row) {
      const err = new Error('API key not found');
      err.status = 404;
      throw err;
    }
    if (row.isRevoked) {
      return;
    }
    row.isRevoked = true;
    row.updatedAt = new Date().toISOString();
    return;
  }

  const oid = toObjectId(id);
  if (!oid) {
    const err = new Error('API key not found');
    err.status = 404;
    throw err;
  }

  const existing = await ApiKey.findById(oid).select('isRevoked').lean();
  if (!existing) {
    const err = new Error('API key not found');
    err.status = 404;
    throw err;
  }
  if (existing.isRevoked) {
    return;
  }

  await ApiKey.updateOne({ _id: oid }, { isRevoked: true });
}

async function revokeKeysForUser(userId) {
  if (env.useMockData) {
    const now = new Date().toISOString();
    for (const row of mockStore.apiKeys) {
      if ((row.createdBy === userId || row.created_by_id === userId) && !row.isRevoked) {
        row.isRevoked = true;
        row.updatedAt = now;
      }
    }
    return;
  }

  const oid = toObjectId(userId);
  if (!oid) {
    return;
  }

  await ApiKey.updateMany({ createdBy: oid, isRevoked: false }, { isRevoked: true });
}

module.exports = {
  createKey,
  listKeys,
  revokeKey,
  revokeKeysForUser,
};
