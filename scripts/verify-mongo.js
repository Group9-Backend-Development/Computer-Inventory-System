/**
 * Verifies MONGODB_URI by connecting once. Run: node scripts/verify-mongo.js
 */
require('dotenv').config();

const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'change-me-in-production') {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const name = mongoose.connection?.db?.databaseName;
  console.log('MongoDB connection OK.', name ? `Database: ${name}` : '');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
