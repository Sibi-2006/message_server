import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatRelativeTime } from '../utils/constants';

const getTypeDetails = (type) => {
  switch (type) {
    case 'like':
      return { icon: '❤️', bg: 'bg-red-500/10', text: 'text-red-500', label: 'Like' };
    case 'comment':
      return { icon: '💬', bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Comment' };
    case 'follow':
      return { icon: '👋', bg: 'bg-green-500/10', text: 'text-green-500', label: 'Follow' };
    case 'message':
      return { icon: '✉️', bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Message' };
    case 'system':
    default:
      return { icon: '⚡', bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'System' };
  }
};

export default function NotificationCard({ notification, onPress }) {
  const { isDark } = useTheme();
  const details = getTypeDetails(notification.type);
  const isUnread = !notification.isRead;

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
      className={`p-4 mb-3 rounded-2xl border flex-row items-center space-x-3 ${
        isUnread
          ? isDark
            ? 'bg-indigo-950/40 border-indigo-700/50'
            : 'bg-indigo-50/70 border-indigo-200'
          : isDark
          ? 'bg-gray-800/60 border-gray-700/60'
          : 'bg-white border-gray-100'
      }`}
    >
      {/* Type Icon */}
      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${details.bg}`}>
        <Text className="text-xl">{details.icon}</Text>
      </View>

      {/* Main Content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className={`text-xs font-bold uppercase ${details.text}`}>
            {details.label}
          </Text>
          <Text className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
            {formatRelativeTime(notification.createdAt)}
          </Text>
        </View>

        <Text
          numberOfLines={2}
          className={`text-sm font-medium ${
            isUnread
              ? isDark
                ? 'text-white'
                : 'text-gray-900 font-semibold'
              : isDark
              ? 'text-gray-300'
              : 'text-gray-600'
          }`}
        >
          {notification.message}
        </Text>
      </View>

      {/* Unread Visual Indicator Dot */}
      {isUnread && (
        <View className="w-3 h-3 rounded-full bg-indigo-600 ml-1" />
      )}
    </TouchableOpacity>
  );
}
