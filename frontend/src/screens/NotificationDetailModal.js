import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatRelativeTime } from '../utils/constants';

export default function NotificationDetailModal({ notification, onClose }) {
  const { isDark } = useTheme();

  if (!notification) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!notification}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center p-5">
        <View
          className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}
        >
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center space-x-2">
              <Text className="text-2xl">
                {notification.type === 'like'
                  ? '❤️'
                  : notification.type === 'comment'
                  ? '💬'
                  : notification.type === 'follow'
                  ? '👋'
                  : notification.type === 'message'
                  ? '✉️'
                  : '⚡'}
              </Text>
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              >
                {notification.type} Notification
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} className="p-1">
              <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text
            className={`text-base font-semibold mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {notification.message}
          </Text>

          <View
            className={`p-3 rounded-2xl mb-4 border ${
              isDark ? 'bg-gray-800/60 border-gray-700/60' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <View className="flex-row justify-between mb-1">
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status:</Text>
              <Text className="text-xs font-bold text-green-500">Read ✓</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Received:</Text>
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatRelativeTime(notification.createdAt)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="bg-indigo-600 p-3.5 rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-sm">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
