require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  useMockData:
    process.env.USE_MOCK_DATA === 'true' ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL === 'change-me-in-production',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || null,
  supabaseDocumentsBucket: process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents',
  required,
};
