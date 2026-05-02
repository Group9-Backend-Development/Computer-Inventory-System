require('dotenv').config();

const mongoose = require('mongoose');

const app = require('./app');
const env = require('./config/env');

const port = Number(process.env.PORT) || 3000;

async function main() {
  if (!env.useMockData) {
    await mongoose.connect(env.required('MONGODB_URI'));
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});