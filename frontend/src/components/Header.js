import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Header({ title, onBellPress, activeTab }) {
  const { isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();

  return (
    <View
      className={`px-4 pt-12 pb-4 flex-row items-center justify-between border-b ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
      }`}
    >
      <View className="flex-row items-center space-x-2">
        <Text className="text-2xl">⚡</Text>
        <View>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title || 'NotifyPulse'}
          </Text>
          {user && (
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Hello, {user.name}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center space-x-3">
        <ThemeToggle />

        {/* Bell Icon with Badge */}
        <TouchableOpacity
          onPress={onBellPress}
          activeOpacity={0.7}
          className={`p-2 rounded-full relative border ${
            activeTab === 'notifications'
              ? 'bg-indigo-600 border-indigo-600'
              : isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-gray-100 border-gray-200'
          }`}
        >
          <Text className="text-base">{activeTab === 'notifications' ? '🔔' : '🔕'}</Text>

          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
              <Text className="text-white text-[10px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={logout}
          activeOpacity={0.7}
          className={`p-2 rounded-full border ${
            isDark ? 'bg-red-950/40 border-red-800/40' : 'bg-red-50 border-red-100'
          }`}
        >
          <Text className="text-xs">🚪</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
