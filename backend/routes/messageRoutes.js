const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { messageRateLimiter } = require('../middleware/rateLimiter');
const {
  sendMessage,
  getConversations,
  getMessages,
  markConversationAsRead,
  deleteMessage,
} = require('../controllers/messageController');

router.post('/messages/send', protect, messageRateLimiter, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/messages/:conversationId', protect, getMessages);
router.patch('/messages/:conversationId/read', protect, markConversationAsRead);
router.delete('/messages/:messageId', protect, deleteMessage);

module.exports = router;
