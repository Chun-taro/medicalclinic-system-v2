const Notification = require('../models/Notification');

const sendNotification = async ({ userId, type = 'appointment', status, message, recipientType, appointmentId }) => {
  try {
    console.log(`Sending ${status} notification to ${recipientType} (ID: ${userId})`);

    if (!userId) {
      console.warn('Cannot send notification: userId is missing');
      return;
    }

    const notification = await Notification.create({
      userId: userId._id || userId,
      type,
      status,
      message,
      recipientType,
      appointmentId,
      timestamp: new Date(),
      read: false
    });

    console.log('Notification saved to DB:', notification._id);

    if (global.io) {
      if (recipientType === 'admin') {
        global.io.emit('adminNotification', notification);
        console.log('Socket emitted: adminNotification');
      } else {
        const roomName = (userId._id || userId).toString();
        global.io.to(roomName).emit('notification', notification);
        console.log(`Socket emitted: notification to room ${roomName}`);
      }
    } else {
      console.warn('global.io not found, socket notification skipped');
    }

    return notification;
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

module.exports = { sendNotification };