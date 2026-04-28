require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT) || 3000;

async function main() {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});