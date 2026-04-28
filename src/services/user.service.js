const User = require('../models/User');
const env = require('../config/env');
const mockStore = require('../data/mockStore');
const { hashPassword } = require('../utils/password');

function publicUser(user) {
  if (!user) {
    return null;
  }

  return {
    _id: user._id || user.id,
    id: user.id || user._id?.toString(),
    email: user.email,
    role: user.role,
    isEnabled: user.isEnabled,
    createdAt: user.createdAt,
  };
}

async function listUsers() {
  if (env.useMockData) {
    return mockStore.clone(mockStore.users.map(publicUser));
  }

  const users = await User.find().sort({ email: 1 }).lean();
  return users.map(publicUser);
}

async function findByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (env.useMockData) {
    return mockStore.users.find((user) => user.email === normalizedEmail) || null;
  }

  return User.findOne({ email: normalizedEmail });
}

async function createUser({ email, password, role = 'technician', isEnabled = true }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    const error = new Error('Email and password are required');
    error.status = 400;
    throw error;
  }

  if (env.useMockData) {
    if (mockStore.users.some((user) => user.email === normalizedEmail)) {
      const error = new Error('User email already exists');
      error.status = 409;
      throw error;
    }

    const user = {
      _id: mockStore.nextId('user', mockStore.users),
      id: mockStore.nextId('user', mockStore.users),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role,
      isEnabled,
      createdAt: new Date().toISOString(),
    };
    mockStore.users.push(user);
    return publicUser(user);
  }

  const user = await User.create({
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role,
    isEnabled,
  });
  return publicUser(user);
}

module.exports = {
  createUser,
  findByEmail,
  listUsers,
  publicUser,
};
