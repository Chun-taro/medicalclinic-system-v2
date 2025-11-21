const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: String,
  brandName: String,
  description: String,
  dosageForm: String,
  strength: String,

  quantityInStock: { type: Number, default: 0 },
  unit: String,
  expiryDate: Date,
  available: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  dispenseHistory: [
    {
      appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
      quantity: Number,
      dispensedAt: { type: Date, default: Date.now },
      dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      source: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);