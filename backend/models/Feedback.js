const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Foreign keys
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // doctor may not always be assigned at booking time
    required: false
  },

  // New generic recipient fields to support admins/superadmins/nurses
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  recipientRole: {
    type: String,
    enum: ['doctor', 'admin', 'superadmin', 'nurse'],
    required: false
  },

  // Feedback fields
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    default: '',
    maxlength: 1000
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
// Indexes for efficient queries
feedbackSchema.index({ doctorId: 1, createdAt: -1 });
feedbackSchema.index({ recipientId: 1, createdAt: -1 });
feedbackSchema.index({ patientId: 1 });
feedbackSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
