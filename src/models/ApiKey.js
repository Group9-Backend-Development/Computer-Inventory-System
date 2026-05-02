const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    keyHash: { type: String, required: true, index: true },
    label: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

apiKeySchema.index({ createdBy: 1, isRevoked: 1 });

module.exports = mongoose.models.ApiKey || mongoose.model('ApiKey', apiKeySchema);
