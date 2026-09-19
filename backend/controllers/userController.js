const mongoose = require('mongoose');
const User = require('../models/User');
const { inMemoryUsers } = require('./authController');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Search users by username or userId
// @route   GET /api/users/search?query=xxxx
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id.toString();

    if (!query || !query.trim()) {
      return res.json({ success: true, users: [] });
    }

    const cleanQuery = query.trim();

    if (isDbConnected()) {
      const users = await User.find({
        _id: { $ne: currentUserId },
        $or: [
          { username: { $regex: cleanQuery, $options: 'i' } },
          { userId: cleanQuery.toUpperCase() },
          { name: { $regex: cleanQuery, $options: 'i' } },
        ],
      })
        .select('-password')
        .limit(20);

      return res.json({ success: true, users });
    } else {
      // In-Memory Fallback Search
      const searchLower = cleanQuery.toLowerCase();
      const matched = Array.from(inMemoryUsers.values())
        .filter((u) => {
          const uId = (u._id || u.id).toString();
          if (uId === currentUserId) return false;

          return (
            u.username.toLowerCase().includes(searchLower) ||
            u.userId.toUpperCase() === cleanQuery.toUpperCase() ||
            u.name.toLowerCase().includes(searchLower)
          );
        })
        .map((u) => ({
          _id: u._id || u.id,
          name: u.name,
          username: u.username,
          userId: u.userId,
          email: u.email,
          status: u.status || 'offline',
          lastSeen: u.lastSeen || new Date(),
        }));

      return res.json({ success: true, users: matched });
    }
  } catch (error) {
    console.error('[Search Users Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};

// @desc    Block a user
// @route   POST /api/users/block
// @access  Private
const blockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id.toString();

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'targetUserId is required' });
    }

    if (isDbConnected()) {
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: targetUserId },
      });
    } else {
      const currentUser = Array.from(inMemoryUsers.values()).find(
        (u) => (u._id || u.id).toString() === currentUserId
      );
      if (currentUser) {
        if (!currentUser.blockedUsers) currentUser.blockedUsers = [];
        if (!currentUser.blockedUsers.includes(targetUserId)) {
          currentUser.blockedUsers.push(targetUserId);
        }
      }
    }

    return res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('[Block User Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to block user' });
  }
};

// @desc    Unblock a user
// @route   POST /api/users/unblock
// @access  Private
const unblockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id.toString();

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'targetUserId is required' });
    }

    if (isDbConnected()) {
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { blockedUsers: targetUserId },
      });
    } else {
      const currentUser = Array.from(inMemoryUsers.values()).find(
        (u) => (u._id || u.id).toString() === currentUserId
      );
      if (currentUser && currentUser.blockedUsers) {
        currentUser.blockedUsers = currentUser.blockedUsers.filter(
          (id) => id.toString() !== targetUserId.toString()
        );
      }
    }

    return res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('[Unblock User Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to unblock user' });
  }
};

module.exports = {
  searchUsers,
  blockUser,
  unblockUser,
};
