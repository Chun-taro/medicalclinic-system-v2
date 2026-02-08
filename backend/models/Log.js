const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // adminId may be empty for user-driven actions (feedback, login, signup)
    required: false
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Appointment actions
      'approve_appointment',
      'reschedule_appointment',
      'complete_consultation',
      'delete_appointment',
      'create_appointment',
      // Medicine actions
      'dispense_medicine',
      'create_medicine',
      'update_medicine',
      'delete_medicine',
      // User actions
      'update_user_role',
      'create_user',
      'delete_user',
      'update_user_profile',
      // Authentication actions
      'user_login',
      'user_logout',
      'user_signup',
      // Password and account actions
      'request_password_reset',
      'confirm_password_reset',
      'update_password',
      // Profile actions
      'upload_profile_picture',
      'update_emergency_contact',
      // Feedback actions
      'create_feedback',
      'submit_feedback',
      'create_feedback_by_admin',
      // System actions
      'system_configuration_change',
      'data_export',
      'data_import'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['appointment', 'medicine', 'user', 'system', 'auth', 'feedback']
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
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', logSchema);
