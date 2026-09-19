/**
 * Utility to send Push Notifications using Expo Push API
 * API Endpoint: https://exp.host/--/api/v2/push/send
 */
const sendExpoPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken || typeof pushToken !== 'string') {
    console.log('[Expo Push] Invalid or missing push token, skipping push notification.');
    return { success: false, reason: 'No token' };
  }

  // Validate basic Expo token format check
  if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
    console.warn(`[Expo Push Warning] Push token '${pushToken}' may not be a standard Expo push token.`);
  }

  const messagePayload = {
    to: pushToken,
    sound: 'default',
    title: title || 'New Notification',
    body: body || '',
    data: data,
    badge: 1,
    priority: 'high',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const result = await response.json();
    console.log('[Expo Push API Response]', JSON.stringify(result));
    return { success: true, result };
  } catch (error) {
    console.error('[Expo Push Error]', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendExpoPushNotification;
