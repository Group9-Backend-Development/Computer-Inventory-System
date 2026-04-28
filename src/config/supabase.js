const { createClient } = require('@supabase/supabase-js');

const env = require('./env');

if (env.useMockData) {
  module.exports = null;
  return;
}

const rawSupabaseUrl = env.required('SUPABASE_URL');
const supabaseServiceRoleKey = env.required('SUPABASE_SERVICE_ROLE_KEY');
const supabaseUrl = /^https?:\/\//i.test(rawSupabaseUrl)
  ? rawSupabaseUrl
  : `https://${rawSupabaseUrl}.supabase.co`;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
