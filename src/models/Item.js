const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true, trim: true },
    serialNumber: { type: String, required: true },
    model: { type: String, required: true },
    brand: { type: String, required: true },
    classification: {
      type: String,
      enum: ['Computer', 'Peripheral'],
      required: true,
    },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ['Available', 'In-Use', 'Maintenance', 'Retired'],
      default: 'Available',
    },
    dateAcquired: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);
