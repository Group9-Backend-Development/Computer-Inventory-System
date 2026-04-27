const { createClient } = require('@supabase/supabase-js');

const env = require('./env');

const supabaseUrl = env.required('SUPABASE_URL');
const supabaseServiceRoleKey = env.required('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
