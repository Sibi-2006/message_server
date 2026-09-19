import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handling behavior when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for Expo Push Notifications and obtain token
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied by user.');
      return null;
    }
    try {
      const tokenObj = await Notifications.getExpoPushTokenAsync();
      token = tokenObj.data;
      console.log('[Expo Push Token]', token);
    } catch (error) {
      console.error('Error fetching Expo Push Token:', error);
    }
  } else {
    console.log('Must use physical device or supported emulator for Push Tokens');
    // Provide a mock token for simulator/emulator testing so full flow works
    token = `ExponentPushToken[Mock-${Date.now()}]`;
  }

  return token;
}

/**
 * Sync push token with backend database
 */
export async function syncPushTokenWithBackend(token, authToken, apiUrl) {
  if (!token || !authToken) return;

  try {
    const res = await fetch(`${apiUrl}/api/users/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pushToken: token }),
    });

    const data = await res.json();
    console.log('[Push Token Synced with Backend]', data);
    return data;
  } catch (error) {
    console.error('Failed to sync push token to backend:', error);
  }
}
