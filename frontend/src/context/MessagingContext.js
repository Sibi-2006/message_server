import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { syncPushTokenWithBackend, registerForPushNotificationsAsync } from '../services/pushNotification';

const MessagingContext = createContext();

export const MessagingProvider = ({ children }) => {
  const { token, user, apiUrl } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> senderName
  const [socket, setSocket] = useState(null);
  const [messageToast, setMessageToast] = useState(null);

  const socketRef = useRef(null);

  // Fetch all conversations for logged-in user
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoadingConversations(true);
    try {
      const res = await fetch(`${apiUrl}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [token, apiUrl]);

  // Fetch message history for a specific conversation
  const fetchMessages = useCallback(
    async (conversationId) => {
      if (!token || !conversationId) return;
      setActiveConversationId(conversationId);
      setLoadingMessages(true);
      try {
        const res = await fetch(`${apiUrl}/api/messages/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMessages(data.messages || []);

          // Mark conversation read on server
          fetch(`${apiUrl}/api/messages/${conversationId}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          });

          // Clear local unread badge count for this conversation
          setConversations((prev) =>
            prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
          );
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, apiUrl]
  );

  // Initialize Socket.IO connection on login
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConversations([]);
      setMessages([]);
      return;
    }

    fetchConversations();

    // Register Push Token
    (async () => {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        await syncPushTokenWithBackend(pushToken, token, apiUrl);
      }
    })();

    console.log(`[Socket] Connecting messaging socket to ${apiUrl}`);
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('[Socket] Messaging connected:', newSocket.id);
    });

    // Real-time message receiver
    newSocket.on('receive_message', ({ message, conversationId, sender }) => {
      console.log('[Socket receive_message]', message);

      // If user is inside this active chat screen, append message directly
      setMessages((prevMsgs) => {
        if (message.conversationId === activeConversationId || conversationId === activeConversationId) {
          if (prevMsgs.some((m) => m._id === message._id)) return prevMsgs;
          return [...prevMsgs, message];
        }
        return prevMsgs;
      });

      // Update chat feed list
      setConversations((prevConvs) => {
        const exists = prevConvs.some((c) => c._id === conversationId);
        if (exists) {
          return prevConvs.map((c) => {
            if (c._id === conversationId) {
              const isActive = conversationId === activeConversationId;
              return {
                ...c,
                lastMessage: message.text,
                lastMessageAt: message.createdAt,
                unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
              };
            }
            return c;
          });
        } else {
          // New conversation created by incoming message
          const newConv = {
            _id: conversationId,
            participants: [sender?._id || sender?.id, user?.id || user?._id],
            otherUser: sender,
            lastMessage: message.text,
            lastMessageAt: message.createdAt,
            unreadCount: 1,
          };
          
          fetchConversations(); // Fetch full list in background
          
          // Prepend optimistically
          return [newConv, ...prevConvs];
        }
      });

      // Show toast if user is not in the active chat screen
      if (conversationId !== activeConversationId) {
        setMessageToast({
          id: Date.now().toString(),
          senderName: sender?.name || 'Someone',
          text: message.text,
          conversationId,
        });
      }
    });

    // Real-time typing indicators
    newSocket.on('user_typing', ({ conversationId, senderName }) => {
      setTypingUsers((prev) => ({ ...prev, [conversationId]: senderName }));
    });

    newSocket.on('stop_typing', ({ conversationId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    });

    // Read receipt updates
    newSocket.on('read_receipt', ({ conversationId }) => {
      setMessages((prevMsgs) =>
        prevMsgs.map((m) =>
          m.conversationId === conversationId ? { ...m, isRead: true, isDelivered: true } : m
        )
      );
    });

    // Online status changes
    newSocket.on('user_status_changed', ({ userId: statusUserId, status, lastSeen }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.otherUser && c.otherUser._id === statusUserId) {
            return {
              ...c,
              otherUser: { ...c.otherUser, status, lastSeen },
            };
          }
          return c;
        })
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, apiUrl, fetchConversations, activeConversationId]);

  // Send message API + local state update
  const sendMessage = async (receiverId, text) => {
    if (!text.trim() || !token) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      conversationId: activeConversationId || 'pending',
      senderId: user?.id || user?._id,
      receiverId,
      text: text.trim(),
      isRead: false,
      isDelivered: false,
      createdAt: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${apiUrl}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId, text: text.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Replace temp message with server returned message
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? data.message : m))
        );

        setActiveConversationId(data.conversationId);
        fetchConversations();
        return data;
      } else {
        throw new Error(data.message || 'Failed to send');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark as failed in UI
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, sending: false, failed: true } : m))
      );
    }
  };

  // Emit typing status
  const sendTyping = (conversationId, receiverId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { conversationId, receiverId });
    }
  };

  const sendStopTyping = (conversationId, receiverId) => {
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { conversationId, receiverId });
    }
  };

  // Block User helper
  const blockUser = async (targetUserId) => {
    try {
      const res = await fetch(`${apiUrl}/api/users/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      return await res.json();
    } catch (e) {
      console.error('Failed to block user:', e);
    }
  };

  const clearMessageToast = () => setMessageToast(null);

  // Compute total unread conversations count
  const totalUnreadConversations = conversations.reduce(
    (acc, curr) => acc + (curr.unreadCount || 0),
    0
  );

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        messages,
        loadingConversations,
        loadingMessages,
        activeConversationId,
        setActiveConversationId,
        fetchConversations,
        fetchMessages,
        sendMessage,
        sendTyping,
        sendStopTyping,
        typingUsers,
        blockUser,
        messageToast,
        clearMessageToast,
        totalUnreadConversations,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => useContext(MessagingContext);
