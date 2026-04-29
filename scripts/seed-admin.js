/**
 * One-time / idempotent: upsert admin user in Supabase.
 * Usage: node scripts/seed-admin.js
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 */
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const EMAIL = 'admin@gmail.com';
const PASSWORD = 'admin123';
const SALT_ROUNDS = 10;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url === 'change-me-in-production') {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabaseUrl = /^https?:\/\//i.test(url) ? url : `https://${url}.supabase.co`;
  const supabase = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        email: EMAIL,
        password_hash: passwordHash,
        role: 'admin',
        is_enabled: true,
      },
      { onConflict: 'email' }
    )
    .select('id, email, role')
    .single();

  if (error) {
    console.error(error.message || error);
    process.exit(1);
  }

  console.log('OK: admin upserted', data);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
