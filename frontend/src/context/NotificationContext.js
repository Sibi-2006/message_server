import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { registerForPushNotificationsAsync, syncPushTokenWithBackend } from '../services/pushNotification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, apiUrl } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  // Sync Push Token & Register Socket.IO on Auth
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Register Push Token
    (async () => {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        await syncPushTokenWithBackend(pushToken, token, apiUrl);
      }
    })();

    // Socket.IO setup
    console.log(`[Socket Client] Connecting to ${apiUrl}`);
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket Client Connected]', newSocket.id);
    });

    newSocket.on('new_notification', (newNotif) => {
      console.log('[Socket Client Received new_notification]', newNotif);

      // Add to notifications list
      setNotifications((prev) => [newNotif, ...prev]);

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Show toast alert
      setToastMessage({
        id: Date.now().toString(),
        type: newNotif.type,
        message: newNotif.message,
      });
    });

    newSocket.on('connect_error', (err) => {
      console.log('[Socket Client Error]', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, apiUrl, fetchNotifications]);

  // Mark single as read
  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Send simulation notification (demo trigger)
  const sendDemoNotification = async (type, message, recipientId = null) => {
    try {
      const res = await fetch(`${apiUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          message,
          recipientId,
        }),
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Failed to send demo notification:', error);
      throw error;
    }
  };

  const clearToast = () => setToastMessage(null);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        sendDemoNotification,
        toastMessage,
        clearToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
