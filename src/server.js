require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT) || 3000;

async function main() {
  console.warn('Starting in mock-data mode. MongoDB connection is skipped for now.');

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});