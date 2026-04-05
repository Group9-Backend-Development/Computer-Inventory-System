const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    type: { type: String, enum: ['checkout', 'checkin'], required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    documentPath: { type: String },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
