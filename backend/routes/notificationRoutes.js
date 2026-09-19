const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  savePushToken,
} = require('../controllers/notificationController');

// Notification endpoints
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/read-all', protect, markAllAsRead);
router.patch('/notifications/:id/read', protect, markAsRead);
router.post('/notifications/send', protect, sendNotification);

// User push token endpoint
router.post('/users/push-token', protect, savePushToken);

module.exports = router;
