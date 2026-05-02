/**
 * Upsert a default admin user in MongoDB.
 *
 * Requires: MONGODB_URI
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');

const EMAIL = 'admin@gmail.com';
const PASSWORD = 'admin123';
const SALT_ROUNDS = 10;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'change-me-in-production') {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const user = await User.findOneAndUpdate(
    { email: EMAIL.toLowerCase() },
    {
      $set: {
        passwordHash,
        role: 'admin',
        isEnabled: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  console.log('OK: admin upserted', { id: String(user._id), email: user.email, role: user.role });

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
