const supabase = require('../config/supabase');

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listUsers() {
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