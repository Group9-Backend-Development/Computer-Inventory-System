const env = require('../config/env');
const mockStore = require('../data/mockStore');
const supabase = require('../config/supabase');
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

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    _id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
  };
}

async function listUsers() {
  if (env.useMockData) {
    return mockStore.clone(mockStore.users.map(publicUser));
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, is_enabled, created_at')
    .order('email', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map((row) =>
    publicUser({
      id: row.id,
      _id: row.id,
      email: row.email,
      role: row.role,
      isEnabled: row.is_enabled,
      createdAt: row.created_at,
    })
  );
}

async function findByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (env.useMockData) {
    return mockStore.users.find((user) => user.email === normalizedEmail) || null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapUserRow(data);
}

async function createUser({ email, password, role = 'technician', isEnabled = true }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    const error = new Error('Email and password are required');
    error.status = 400;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  if (env.useMockData) {
    if (mockStore.users.some((user) => user.email === normalizedEmail)) {
      const dup = new Error('User email already exists');
      dup.status = 409;
      throw dup;
    }

    const user = {
      _id: mockStore.nextId('user', mockStore.users),
      id: mockStore.nextId('user', mockStore.users),
      email: normalizedEmail,
      passwordHash,
      role,
      isEnabled,
      createdAt: new Date().toISOString(),
    };
    mockStore.users.push(user);
    return publicUser(user);
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      role,
      is_enabled: isEnabled,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505' || /duplicate/i.test(error.message || '')) {
      const dup = new Error('User email already exists');
      dup.status = 409;
      throw dup;
    }
    throw error;
  }

  return publicUser(mapUserRow(data));
}

module.exports = {
  createUser,
  findByEmail,
  listUsers,
  publicUser,
};
