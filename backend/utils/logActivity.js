const Log = require('../models/Log');

const logActivity = async (adminId, adminName, adminRole, action, entityType, entityId, details = {}) => {
  try {
    // Generate description based on action
    let description = '';
    switch (action) {
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
      case 'update_user_role':
        description = `${adminName} (${adminRole}) updated a user's role`;
        break;
      case 'delete_appointment':
        description = `${adminName} (${adminRole}) deleted an appointment for ${details.patientName}`;
        break;
      default:
        description = `${adminName} (${adminRole}) performed ${action.replace('_', ' ')}`;
    }

    const log = new Log({
      adminId,
      action,
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
