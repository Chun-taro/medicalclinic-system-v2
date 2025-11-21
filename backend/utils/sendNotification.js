const Notification = require('../models/Notification');

const sendNotification = async ({ userId, type = 'appointment', status, message, recipientType }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      status,
      message,
      recipientType,
      timestamp: new Date(),
      read: false
    });

  
    if (global.io) {
      if (recipientType === 'admin') {
        global.io.emit('adminNotification', notification);
      } else {
        global.io.to(userId.toString()).emit('notification', notification);
      }
    }
  } catch (err) {
    console.error(' Notification error:', err.message);
  }
};

module.exports = { sendNotification };