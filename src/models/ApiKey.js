const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    keyHash: { type: String, required: true, index: true },
    label: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiKey', apiKeySchema);
