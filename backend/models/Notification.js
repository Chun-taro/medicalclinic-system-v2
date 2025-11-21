const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['appointment'],
    default: 'appointment'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'rescheduled', 'completed', 'updated'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  recipientType: {
    type: String,
    enum: ['admin', 'patient'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);