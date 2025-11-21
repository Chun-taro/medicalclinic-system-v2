const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.get('/unread', auth, getUnreadCount);
router.put('/:id/read', auth, markAsRead);
router.put('/read-all', auth, markAllAsRead);

module.exports = router;