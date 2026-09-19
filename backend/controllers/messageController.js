const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { deliverMessageSocket, deliverNotification } = require('../sockets/socketHandler');
const { inMemoryUsers } = require('./authController');
const { sanitizeText } = require('../utils/sanitize');

const inMemoryConversations = new Map(); // id -> conv
const inMemoryMessages = []; // list of messages

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Send a message
// @route   POST /api/messages/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, messageType } = req.body;
    const senderId = req.user.id.toString();

    if (!receiverId || !text) {
      return res.status(400).json({ success: false, message: 'receiverId and text are required' });
    }

    const cleanText = sanitizeText(text);
    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    let conversation;
    let messageObj;
    let receiverUser;

    if (isDbConnected()) {
      receiverUser = await User.findById(receiverId);
      if (!receiverUser) {
        return res.status(404).json({ success: false, message: 'Recipient user not found' });
      }

      // Check if blocked
      const senderUser = await User.findById(senderId);
      if (
        (receiverUser.blockedUsers && receiverUser.blockedUsers.includes(senderId)) ||
        (senderUser.blockedUsers && senderUser.blockedUsers.includes(receiverId))
      ) {
        return res.status(403).json({ success: false, message: 'Cannot send message to this user' });
      }

      // Find or create conversation
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          lastMessage: cleanText,
          lastMessageAt: new Date(),
          unreadCount: { [receiverId]: 1 },
        });
      } else {
        conversation.lastMessage = cleanText;
        conversation.lastMessageAt = new Date();
        const currentUnread = conversation.unreadCount.get(receiverId) || 0;
        conversation.unreadCount.set(receiverId, currentUnread + 1);
        await conversation.save();
      }

      messageObj = await Message.create({
        conversationId: conversation._id,
        senderId,
        receiverId,
        text: cleanText,
        messageType: messageType || 'text',
      });

      // Also create notification entry
      const notification = await Notification.create({
        recipientId: receiverId,
        senderId: senderId,
        type: 'message',
        message: `${req.user.name || 'Someone'}: ${cleanText.substring(0, 50)}`,
      });

      // Socket & Push Delivery
      const io = req.app.get('io');
      await deliverMessageSocket(io, messageObj, conversation, receiverUser, req.user);
      await deliverNotification(io, notification, receiverUser);

      return res.status(201).json({
        success: true,
        message: messageObj,
        conversationId: conversation._id,
      });
    } else {
      // In-Memory Fallback
      receiverUser = Array.from(inMemoryUsers.values()).find(
        (u) => (u._id || u.id).toString() === receiverId.toString()
      );

      // Find or create in-memory conv
      const convKey = [senderId, receiverId].sort().join('_');
      conversation = inMemoryConversations.get(convKey);

      const fakeConvId = conversation ? conversation._id : new mongoose.Types.ObjectId().toString();

      if (!conversation) {
        conversation = {
          _id: fakeConvId,
          participants: [senderId, receiverId],
          lastMessage: cleanText,
          lastMessageAt: new Date(),
          unreadCount: { [receiverId]: 1 },
          createdAt: new Date(),
        };
        inMemoryConversations.set(convKey, conversation);
      } else {
        conversation.lastMessage = cleanText;
        conversation.lastMessageAt = new Date();
        conversation.unreadCount[receiverId] = (conversation.unreadCount[receiverId] || 0) + 1;
      }

      const fakeMsgId = new mongoose.Types.ObjectId().toString();
      messageObj = {
        _id: fakeMsgId,
        conversationId: fakeConvId,
        senderId,
        receiverId,
        text: cleanText,
        isRead: false,
        isDelivered: false,
        messageType: messageType || 'text',
        deletedFor: [],
        createdAt: new Date(),
      };

      inMemoryMessages.push(messageObj);

      const io = req.app.get('io');
      await deliverMessageSocket(io, messageObj, conversation, receiverUser, req.user);

      return res.status(201).json({
        success: true,
        message: messageObj,
        conversationId: fakeConvId,
      });
    }
  } catch (error) {
    console.error('[Send Message Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// @desc    Get user conversations list
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id.toString();

    if (isDbConnected()) {
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'name username userId status lastSeen profilePicture')
        .sort({ lastMessageAt: -1 });

      const formatted = conversations.map((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== userId
        );
        const unread = conv.unreadCount ? conv.unreadCount.get(userId) || 0 : 0;

        return {
          _id: conv._id,
          otherUser: otherParticipant,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount: unread,
        };
      });

      return res.json({ success: true, conversations: formatted });
    } else {
      // In-Memory Fallback
      const convList = Array.from(inMemoryConversations.values())
        .filter((c) => c.participants.includes(userId))
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      const formatted = convList.map((c) => {
        const otherId = c.participants.find((p) => p !== userId);
        const otherUser = Array.from(inMemoryUsers.values()).find(
          (u) => (u._id || u.id).toString() === otherId
        ) || { name: 'User', username: 'user', userId: otherId };

        return {
          _id: c._id,
          otherUser: {
            _id: otherUser._id || otherUser.id,
            name: otherUser.name,
            username: otherUser.username,
            userId: otherUser.userId,
            status: otherUser.status || 'offline',
            lastSeen: otherUser.lastSeen || new Date(),
          },
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          unreadCount: c.unreadCount ? c.unreadCount[userId] || 0 : 0,
        };
      });

      return res.json({ success: true, conversations: formatted });
    }
  } catch (error) {
    console.error('[Get Conversations Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id.toString();

    if (isDbConnected()) {
      const messages = await Message.find({
        conversationId,
        deletedFor: { $ne: userId },
      }).sort({ createdAt: 1 });

      return res.json({ success: true, messages });
    } else {
      const msgs = inMemoryMessages.filter(
        (m) =>
          m.conversationId.toString() === conversationId.toString() &&
          (!m.deletedFor || !m.deletedFor.includes(userId))
      );
      return res.json({ success: true, messages: msgs });
    }
  } catch (error) {
    console.error('[Get Messages Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// @desc    Mark conversation messages as read
// @route   PATCH /api/messages/:conversationId/read
// @access  Private
const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id.toString();

    if (isDbConnected()) {
      await Message.updateMany(
        { conversationId, receiverId: userId, isRead: false },
        { $set: { isRead: true, isDelivered: true } }
      );

      const conv = await Conversation.findById(conversationId);
      if (conv) {
        conv.unreadCount.set(userId, 0);
        await conv.save();
      }
    } else {
      inMemoryMessages.forEach((m) => {
        if (m.conversationId.toString() === conversationId.toString() && m.receiverId === userId) {
          m.isRead = true;
          m.isDelivered = true;
        }
      });
      const conv = Array.from(inMemoryConversations.values()).find(
        (c) => c._id.toString() === conversationId.toString()
      );
      if (conv && conv.unreadCount) {
        conv.unreadCount[userId] = 0;
      }
    }

    return res.json({ success: true, message: 'Conversation marked as read' });
  } catch (error) {
    console.error('[Mark Conv Read Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to mark conversation read' });
  }
};

// @desc    Delete message for self
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id.toString();

    if (isDbConnected()) {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deletedFor: userId },
      });
    } else {
      const msg = inMemoryMessages.find((m) => m._id.toString() === messageId.toString());
      if (msg) {
        if (!msg.deletedFor) msg.deletedFor = [];
        msg.deletedFor.push(userId);
      }
    }

    return res.json({ success: true, message: 'Message deleted for you' });
  } catch (error) {
    console.error('[Delete Message Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  markConversationAsRead,
  deleteMessage,
};
