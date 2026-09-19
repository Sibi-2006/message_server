const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { searchUsers, blockUser, unblockUser } = require('../controllers/userController');
const { savePushToken } = require('../controllers/notificationController');

router.get('/search', protect, searchUsers);
router.post('/block', protect, blockUser);
router.post('/unblock', protect, unblockUser);
router.post('/push-token', protect, savePushToken);

module.exports = router;
