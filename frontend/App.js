import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { wakeUpServer } from './src/utils/wakeUpServer';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Image } from 'react-native';
import * as Notifications from 'expo-notifications';
import WakeUpScreen from './src/screens/WakeUpScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { MessagingProvider, useMessaging } from './src/context/MessagingContext';
import { NotificationProvider } from './src/context/NotificationContext';

import Header from './src/components/Header';
import Toast from './src/components/Toast';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

function MainApp() {
  const { isDark } = useTheme();
  const { token, loading: authLoading } = useAuth();
  const { totalUnreadConversations, messageToast, clearMessageToast } = useMessaging();

  const [authScreen, setAuthScreen] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'search', 'notifications', 'profile'
  const [activeChat, setActiveChat] = useState(null); // { conversation, targetUser }
  const [serverReady, setServerReady] = useState(false);
  const [wakeUpStatus, setWakeUpStatus] = useState('Connecting…');

  useEffect(() => {
    let t1, t2;
    (async () => {
      t1 = setTimeout(() => setWakeUpStatus('Almost there…'), 8000);
      t2 = setTimeout(() => setWakeUpStatus('This is taking longer than usual…'), 20000);
      try {
        await wakeUpServer();
      } catch (e) {
        console.warn('Server wake-up failed:', e);
      } finally {
        clearTimeout(t1);
        clearTimeout(t2);
        setServerReady(true);
      }
    })();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Push notification tap navigation
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Push Notification Tapped]', response);
      setActiveTab('chats');
    });

    return () => subscription.remove();
  }, []);

  if (!serverReady || authLoading) {
    return <WakeUpScreen statusText={wakeUpStatus} />;
  }

  // Auth Flow
  if (!token) {
    return authScreen === 'login' ? (
      <LoginScreen onNavigateRegister={() => setAuthScreen('register')} />
    ) : (
      <RegisterScreen onNavigateLogin={() => setAuthScreen('login')} />
    );
  }

  // Active Chat Screen Overlay
  if (activeChat) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <ChatScreen
          conversation={activeChat.conversation}
          targetUser={activeChat.targetUser}
          onBack={() => setActiveChat(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <Header
        title={
          activeTab === 'chats'
            ? 'Messages'
            : activeTab === 'search'
            ? 'Find Friends'
            : activeTab === 'notifications'
            ? 'Notifications'
            : 'Profile'
        }
        activeTab={activeTab}
        onBellPress={() => setActiveTab('notifications')}
      />

      {/* Real-time Incoming Message Toast */}
      {messageToast && (
        <TouchableOpacity
          onPress={() => {
            clearMessageToast();
            setActiveChat({ conversation: { _id: messageToast.conversationId } });
          }}
          activeOpacity={0.9}
          className="absolute top-16 left-4 right-4 z-50 p-4 rounded-2xl bg-indigo-600 shadow-xl flex-row items-center space-x-3"
        >
          <Text className="text-2xl">💬</Text>
          <View className="flex-1">
            <Text className="text-white font-bold text-xs uppercase tracking-wider">
              {messageToast.senderName}
            </Text>
            <Text numberOfLines={1} className="text-white text-sm font-medium">
              {messageToast.text}
            </Text>
          </View>
          <TouchableOpacity onPress={clearMessageToast}>
            <Text className="text-white text-xs">✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Active Screen View */}
      <View className="flex-1">
        {activeTab === 'chats' && (
          <HomeScreen
            onOpenChat={(conv) => setActiveChat({ conversation: conv })}
            onNavigateSearch={() => setActiveTab('search')}
          />
        )}
        {activeTab === 'search' && (
          <SearchScreen
            onSelectUser={(u) => setActiveChat({ targetUser: u })}
            onBack={() => setActiveTab('chats')}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationsScreen onNavigateHome={() => setActiveTab('chats')} />
        )}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View
        className={`px-4 py-3 border-t flex-row items-center justify-around ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {/* Chats Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('chats')}
          className="items-center relative px-4"
        >
          <Image
            source={require('./assets/icon.png')}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              opacity: activeTab === 'chats' ? 1 : 0.45,
              tintColor: activeTab === 'chats' ? undefined : (isDark ? '#9CA3AF' : '#6B7280'),
            }}
            resizeMode="contain"
          />
          <Text
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'chats' ? 'text-indigo-600' : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Chats
          </Text>
          {totalUnreadConversations > 0 && (
            <View className="absolute top-0 right-2 bg-indigo-600 rounded-full min-w-[16px] h-[16px] items-center justify-center px-1">
              <Text className="text-white text-[9px] font-bold">
                {totalUnreadConversations}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Search Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          className="items-center px-4"
        >
          <Text className="text-xl">🔍</Text>
          <Text
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'search' ? 'text-indigo-600' : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Search
          </Text>
        </TouchableOpacity>

        {/* Notifications Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('notifications')}
          className="items-center px-4"
        >
          <Text className="text-xl">🔔</Text>
          <Text
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'notifications' ? 'text-indigo-600' : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Alerts
          </Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          className="items-center px-4"
        >
          <Text className="text-xl">👤</Text>
          <Text
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'profile' ? 'text-indigo-600' : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MessagingProvider>
          <NavigationContainer>
            <NotificationProvider>
              <MainApp />
            </NotificationProvider>
          </NavigationContainer>
        </MessagingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
