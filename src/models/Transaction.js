const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    type: { type: String, enum: ['checkout', 'checkin'], required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    documentPath: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

transactionSchema.index({ item: 1, createdAt: 1 });
transactionSchema.index({ assignee: 1 });
transactionSchema.index({ performedBy: 1 });

module.exports =
  mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
