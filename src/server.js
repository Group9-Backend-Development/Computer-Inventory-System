require('dotenv').config();

const app = require('./app');
const env = require('./config/env');
const { connectMongo } = require('./config/database');

const port = Number(process.env.PORT) || 3000;

async function main() {
  await connectMongo();

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});