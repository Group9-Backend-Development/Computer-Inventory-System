const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true, trim: true },
    serialNumber: { type: String, trim: true },
    model: { type: String, trim: true },
    brand: { type: String, trim: true },
    category: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Available', 'In-Use', 'Maintenance', 'Retired'],
      default: 'Available',
    },
    dateAcquired: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
