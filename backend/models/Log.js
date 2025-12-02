const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['approve_appointment', 'reschedule_appointment', 'complete_consultation', 'dispense_medicine', 'update_user_role', 'delete_appointment']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['appointment', 'medicine', 'user']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', logSchema);
