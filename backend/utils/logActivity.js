const Log = require('../models/Log');

const logActivity = async (adminId, adminName, adminRole, action, entityType, entityId, details = {}) => {
  try {
    // Support being called with an options object: logActivity({ adminId, adminName, adminRole, action, entityType, entityId, details })
    if (typeof adminId === 'object' && !Array.isArray(adminId) && adminId !== null) {
      const opts = adminId;
      adminId = opts.adminId || opts.userId || null;
      adminName = opts.adminName || opts.userName || opts.userName || '';
      adminRole = opts.adminRole || opts.userRole || '';
      action = opts.action;
      entityType = opts.entityType || opts.type || 'system';
      entityId = opts.entityId || opts.id || null;
      details = opts.details || {};
    }

    // Ensure action is a string
    const actionStr = (typeof action === 'string') ? action : String(action || 'action');

    // Generate description based on action
    let description = '';
    switch (actionStr) {
      case 'approve_appointment':
        description = `${adminName} (${adminRole}) approved an appointment for ${details.patientName}`;
        break;
      case 'reschedule_appointment':
        description = `${adminName} (${adminRole}) rescheduled an appointment for ${details.patientName}`;
        break;
      case 'complete_consultation':
        description = `${adminName} (${adminRole}) completed a consultation for ${details.patientName}`;
        break;
      case 'dispense_medicine':
        description = `${adminName} (${adminRole}) dispensed medicine`;
        break;
      case 'create_feedback':
      case 'submit_feedback':
      case 'create_feedback_by_admin':
        description = `${adminName || details.userName || details.patientName || 'User'} (${adminRole || 'user'}) submitted feedback: ${details.rating || ''} star`;
        break;
      case 'update_user_role':
        description = `${adminName} (${adminRole}) updated a user's role`;
        break;
      case 'delete_appointment':
        description = `${adminName} (${adminRole}) deleted an appointment for ${details.patientName}`;
        break;
      default:
        description = `${adminName || details.userName || details.patientName || 'User'} (${adminRole || 'user'}) performed ${actionStr.replace(/_/g, ' ')}`;
    }

    const log = new Log({
      adminId,
      action: actionStr,
      entityType,
      entityId,
      details,
      description
    });
    const savedLog = await log.save();

    // Populate adminId for the emitted log
    const populatedLog = await Log.findById(savedLog._id).populate('adminId', 'firstName lastName').lean();

    // Emit the new log to all connected clients
    if (global.io) {
      global.io.emit('new_log', populatedLog);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = logActivity;
