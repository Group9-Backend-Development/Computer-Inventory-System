const mongoose = require('mongoose');

const env = require('./env');

const globalCache = globalThis;

function getCache() {
  if (!globalCache.__mongoose) {
    globalCache.__mongoose = { promise: null };
  }
  return globalCache.__mongoose;
}

/**
 * Connects once per warm serverless instance (or once on a long-lived Node server).
 * Safe to call multiple times.
 */
async function connectMongo() {
  if (env.useMockData) {
    return;
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  const cache = getCache();
  if (!cache.promise) {
    const uri = env.required('MONGODB_URI');
    cache.promise = mongoose.connect(uri).then(() => mongoose);
  }

  await cache.promise;
}

module.exports = { connectMongo };
