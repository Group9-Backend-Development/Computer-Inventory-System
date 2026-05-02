const mongoose = require('mongoose');

function toObjectId(id) {
  if (id == null || id === '') {
    return null;
  }
  const s = String(id);
  if (!mongoose.Types.ObjectId.isValid(s)) {
    return null;
  }
  return new mongoose.Types.ObjectId(s);
}

module.exports = { toObjectId };
