const crypto = require('crypto');

const TTL_MS = 120000;

const pending = new Map();

function prune() {
  const now = Date.now();
  for (const [token, payload] of pending) {
    if (now > payload.exp) {
      pending.delete(token);
    }
  }
}

function storePlaintextOnce(plaintext) {
  prune();
  const token = crypto.randomBytes(24).toString('base64url');
  pending.set(token, {
    plaintext: String(plaintext),
    exp: Date.now() + TTL_MS,
  });
  return token;
}

function takePlaintext(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  prune();
  const payload = pending.get(token);
  if (!payload || Date.now() > payload.exp) {
    pending.delete(token);
    return null;
  }
  pending.delete(token);
  return payload.plaintext;
}

module.exports = {
  storePlaintextOnce,
  takePlaintext,
};
