const env = require('../config/env');
const mockStore = require('../data/mockStore');
const User = require('../models/User');
const apiKeyService = require('./apiKey.service');
const { toObjectId } = require('../utils/objectId');

function mapUser(row) {
  if (!row) {
    return null;
  }

  const id = row.id || String(row._id);

  return {
    id,
    email: row.email,
    role: row.role,
    isEnabled: row.is_enabled ?? row.isEnabled,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

async function listUsers() {
  if (env.useMockData) {
    return mockStore.clone(
      mockStore.users
        .map(mapUser)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  }

  const rows = await User.find().sort({ createdAt: -1 }).lean();
  return rows.map((row) =>
    mapUser({
      _id: row._id,
      email: row.email,
      role: row.role,
      isEnabled: row.isEnabled,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  );
}

async function createUser({ email, passwordHash, role }) {
  if (env.useMockData) {
    const id = mockStore.nextId('u', mockStore.users);
    const now = new Date().toISOString();
    const user = {
      _id: id,
      id,
      email,
      passwordHash,
      role,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    };
    mockStore.users.push(user);
    return mapUser(user);
  }

  const created = await User.create({
    email,
    passwordHash,
    role,
    isEnabled: true,
  });

  return mapUser(created.toObject());
}

async function findUserById(id) {
  if (env.useMockData) {
    const user = mockStore.users.find((row) => row.id === id || row._id === id);
    return mapUser(user || null);
  }

  const oid = toObjectId(id);
  if (!oid) {
    return null;
  }

  const row = await User.findById(oid).lean();
  if (!row) {
    return null;
  }

  return mapUser({
    _id: row._id,
    email: row.email,
    role: row.role,
    isEnabled: row.isEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

async function findUserByEmail(email) {
  if (env.useMockData) {
    const data = mockStore.users.find((row) => row.email === email);
    return data
      ? {
          id: data.id,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          isEnabled: data.isEnabled,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
      : null;
  }

  const row = await User.findOne({ email: email.trim().toLowerCase() }).lean();
  if (!row) {
    return null;
  }

  return {
    id: String(row._id),
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    isEnabled: row.isEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function updateUserRole(id, role) {
  if (env.useMockData) {
    const user = mockStore.users.find((row) => row.id === id || row._id === id);
    if (!user) {
      return null;
    }
    user.role = role;
    user.updatedAt = new Date().toISOString();
    return mapUser(user);
  }

  const oid = toObjectId(id);
  if (!oid) {
    return null;
  }

  const updated = await User.findByIdAndUpdate(oid, { role }, { new: true }).lean();
  return mapUser(updated);
}

async function updateUserStatus(id, isEnabled) {
  if (env.useMockData) {
    const user = mockStore.users.find((row) => row.id === id || row._id === id);
    if (!user) {
      return null;
    }
    user.isEnabled = isEnabled;
    user.updatedAt = new Date().toISOString();
    if (!isEnabled) {
      await apiKeyService.revokeKeysForUser(user.id);
    }
    return mapUser(user);
  }

  const oid = toObjectId(id);
  if (!oid) {
    return null;
  }

  const updated = await User.findByIdAndUpdate(oid, { isEnabled }, { new: true }).lean();
  if (updated && !isEnabled) {
    await apiKeyService.revokeKeysForUser(String(updated._id));
  }

  return mapUser(updated);
}

module.exports = {
  listUsers,
  createUser,
  findUserById,
  findUserByEmail,
  updateUserRole,
  updateUserStatus,
};
