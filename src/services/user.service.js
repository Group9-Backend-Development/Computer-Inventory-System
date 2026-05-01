const supabase = require('../config/supabase');
const env = require('../config/env');
const mockStore = require('../data/mockStore');
const apiKeyService = require('./apiKey.service');

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id || row._id,
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

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(mapUser);
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

  const payload = {
    email,
    password_hash: passwordHash,
    role,
    is_enabled: true,
  };

  const { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapUser(data);
}

async function findUserById(id) {
  if (env.useMockData) {
    const user = mockStore.users.find((row) => row.id === id || row._id === id);
    return mapUser(user || null);
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapUser(data);
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

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        role: data.role,
        isEnabled: data.is_enabled,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    : null;
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

  const { data, error } = await supabase
    .from('users')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapUser(data);
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

  const { data, error } = await supabase
    .from('users')
    .update({
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data && !isEnabled) {
    await apiKeyService.revokeKeysForUser(id);
  }

  return mapUser(data);
}

module.exports = {
  listUsers,
  createUser,
  findUserById,
  findUserByEmail,
  updateUserRole,
  updateUserStatus,
};