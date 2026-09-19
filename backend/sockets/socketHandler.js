const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const sendExpoPushNotification = require('../utils/pushNotification');

const userSocketMap = new Map(); // userId string -> socket.id

const isDbConnected = () => mongoose.connection.readyState === 1;

const initSocket = (io) => {
  // Socket JWT Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_notification_platform_2026');
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id.toString();
    console.log(`[Socket.IO] User connected: ${socket.user.name} (@${socket.user.username}) | Socket: ${socket.id}`);

    userSocketMap.set(userId, socket.id);

    // Update user status online
    io.emit('user_status_changed', {
      userId,
      status: 'online',
    });

    // Handle real-time typing events
    socket.on('typing', ({ conversationId, receiverId }) => {
      const targetSocketId = userSocketMap.get(receiverId?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit('user_typing', {
          conversationId,
          senderId: userId,
          senderName: socket.user.name,
        });
      }
    });

    socket.on('stop_typing', ({ conversationId, receiverId }) => {
      const targetSocketId = userSocketMap.get(receiverId?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit('stop_typing', {
          conversationId,
          senderId: userId,
        });
      }
    });

    // Handle read receipt event
    socket.on('message_read', ({ conversationId, senderId }) => {
      const targetSocketId = userSocketMap.get(senderId?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit('read_receipt', {
          conversationId,
          readerId: userId,
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${userId}`);
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
      }

      const lastSeen = new Date();
      io.emit('user_status_changed', {
        userId,
        status: 'offline',
        lastSeen,
      });
    });
  });
};

/**
 * Deliver real-time chat message via Socket.IO or trigger Expo push notification
 */
const deliverMessageSocket = async (io, messageObj, conversation, receiverUser, senderUser) => {
  const receiverIdStr = messageObj.receiverId.toString();
  const targetSocketId = userSocketMap.get(receiverIdStr);

  let socketDelivered = false;

  if (targetSocketId && io.sockets.sockets.get(targetSocketId)) {
    console.log(`[Socket.IO] Delivering real-time message to receiver ${receiverIdStr}`);
    io.to(targetSocketId).emit('receive_message', {
      message: messageObj,
      conversationId: conversation._id,
      sender: {
        id: senderUser.id || senderUser._id,
        name: senderUser.name,
        username: senderUser.username,
      },
    });
    socketDelivered = true;
  }

  // Trigger Push Notification if user is offline or not actively on current socket
  if (!socketDelivered && receiverUser && receiverUser.pushToken) {
    console.log(`[Push API] Receiver ${receiverIdStr} is offline. Dispatching push notification.`);
    const title = senderUser.name ? `${senderUser.name}` : 'New Message 💬';
    const body = messageObj.text || 'Sent you a message';

    await sendExpoPushNotification(receiverUser.pushToken, title, body, {
      conversationId: conversation._id,
      type: 'message',
    });
  }

  return { socketDelivered };
};

/**
 * Legacy notification delivery helper
 */
const deliverNotification = async (io, notification, recipientUser) => {
  const recipientIdStr = notification.recipientId.toString();
  const socketId = userSocketMap.get(recipientIdStr);

  if (socketId && io.sockets.sockets.get(socketId)) {
    io.to(socketId).emit('new_notification', notification);
  }
};

module.exports = {
  initSocket,
  deliverMessageSocket,
  deliverNotification,
  userSocketMap,
};
