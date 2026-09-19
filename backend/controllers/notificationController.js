const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { deliverNotification } = require('../sockets/socketHandler');
const { inMemoryUsers } = require('./authController');

const inMemoryNotifications = [];

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id.toString();

    if (isDbConnected()) {
      const notifications = await Notification.find({ recipientId: userId })
        .populate('senderId', 'name email')
        .sort({ createdAt: -1 });

      const unreadCount = await Notification.countDocuments({
        recipientId: userId,
        isRead: false,
      });

      return res.json({
        success: true,
        unreadCount,
        notifications,
      });
    } else {
      const userNotifs = inMemoryNotifications
        .filter((n) => n.recipientId.toString() === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const unreadCount = userNotifs.filter((n) => !n.isRead).length;

      return res.json({
        success: true,
        unreadCount,
        notifications: userNotifs,
      });
    }
  } catch (error) {
    console.error('[Get Notifications Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();

    if (isDbConnected()) {
      const notification = await Notification.findOne({
        _id: id,
        recipientId: userId,
      });

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      notification.isRead = true;
      await notification.save();

      return res.json({
        success: true,
        message: 'Notification marked as read',
        notification,
      });
    } else {
      const notif = inMemoryNotifications.find(
        (n) => n._id.toString() === id.toString() && n.recipientId.toString() === userId
      );

      if (!notif) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      notif.isRead = true;

      return res.json({
        success: true,
        message: 'Notification marked as read',
        notification: notif,
      });
    }
  } catch (error) {
    console.error('[Mark Read Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// @desc    Mark all notifications for logged in user as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id.toString();

    if (isDbConnected()) {
      await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { $set: { isRead: true } }
      );
    } else {
      inMemoryNotifications.forEach((n) => {
        if (n.recipientId.toString() === userId) {
          n.isRead = true;
        }
      });
    }

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('[Mark All Read Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

// @desc    Create and emit a notification (Demo / simulation)
// @route   POST /api/notifications/send
// @access  Private
const sendNotification = async (req, res) => {
  try {
    const { recipientId, type, message } = req.body;
    const senderId = req.user.id.toString();
    const targetRecipientId = (recipientId || senderId).toString();

    let recipientUser;
    let notification;

    if (isDbConnected()) {
      recipientUser = await User.findById(targetRecipientId);
      if (!recipientUser) {
        return res.status(404).json({ success: false, message: 'Recipient user not found' });
      }

      notification = await Notification.create({
        recipientId: targetRecipientId,
        senderId: senderId,
        type: type || 'system',
        message: message || `You received a new ${type || 'system'} notification!`,
      });
    } else {
      recipientUser = Array.from(inMemoryUsers.values()).find(
        (u) => (u._id || u.id).toString() === targetRecipientId
      );

      const fakeId = new mongoose.Types.ObjectId().toString();
      notification = {
        _id: fakeId,
        recipientId: targetRecipientId,
        senderId: senderId,
        type: type || 'system',
        message: message || `You received a new ${type || 'system'} notification!`,
        isRead: false,
        createdAt: new Date(),
      };

      inMemoryNotifications.push(notification);
    }

    const io = req.app.get('io');
    const deliveryStatus = await deliverNotification(io, notification, recipientUser);

    return res.status(201).json({
      success: true,
      message: 'Notification created and dispatched successfully',
      notification,
      deliveryStatus,
    });
  } catch (error) {
    console.error('[Send Notification Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};

// @desc    Save/update push token for logged-in user
// @route   POST /api/users/push-token
// @access  Private
const savePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.id.toString();

    if (!pushToken) {
      return res.status(400).json({ success: false, message: 'pushToken is required' });
    }

    if (isDbConnected()) {
      const user = await User.findByIdAndUpdate(
        userId,
        { pushToken },
        { new: true }
      ).select('-password');

      return res.json({
        success: true,
        message: 'Push token updated successfully',
        user,
      });
    } else {
      const user = Array.from(inMemoryUsers.values()).find(
        (u) => (u._id || u.id).toString() === userId
      );
      if (user) {
        user.pushToken = pushToken;
      }

      return res.json({
        success: true,
        message: 'Push token updated successfully',
        user,
      });
    }
  } catch (error) {
    console.error('[Push Token Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to update push token' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  savePushToken,
};
