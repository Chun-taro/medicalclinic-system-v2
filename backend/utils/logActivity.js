const Log = require('../models/Log');

const logActivity = async (adminId, adminName, adminRole, action, entityType, entityId, details = {}) => {
  try {
    const log = new Log({
      adminId,
      action,
      entityType,
      entityId,
      details
    });
    await log.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = logActivity;
