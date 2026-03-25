const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth'); // Corrected import

// All chat routes are protected
router.use(auth);

router.get('/conversations', chatController.getConversations);
router.get('/token', chatController.getStreamToken);
router.get('/messages/:conversationId', chatController.getMessages);
router.post('/send', chatController.sendMessage);
router.put('/read/:conversationId', chatController.markAsRead);
router.get('/search-users', chatController.searchUsers);
router.get('/staff', chatController.getStaff);

module.exports = router;
