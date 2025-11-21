const Notification = require('../models/Notification');

//  Get all notifications for logged-in user
const getNotifications = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      query.recipientType = 'admin';
    } else {
      query.userId = req.user.userId;
    }

    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .lean();

    res.json(notifications);
  } catch (err) {
    console.error(' Fetch notifications error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

//  Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    let query = { read: false };

    if (req.user.role === 'admin') {
      query.recipientType = 'admin';
    } else {
      query.userId = req.user.userId;
    }

    const count = await Notification.countDocuments(query);
    res.json({ unreadCount: count });
  } catch (err) {
    console.error(' Unread count error:', err.message);
    res.status(500).json({ error: 'Failed to count unread notifications' });
  }
};

// Mark one notification as read
const markAsRead = async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(' Mark as read error:', err.message);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

//  Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    let query = { read: false };

    if (req.user.role === 'admin') {
      query.recipientType = 'admin';
    } else {
      query.userId = req.user.userId;
    }

    await Notification.updateMany(query, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(' Mark all error:', err.message);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};