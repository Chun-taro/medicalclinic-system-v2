const Notification = require('../models/Notification');

const sendNotification = async ({ userId, type = 'appointment', status, message }) => {
  const notification = new Notification({
    userId,
    type,
    status,
    message,
    timestamp: new Date(),
    read: false
  });
  await notification.save();
};

module.exports = { sendNotification };