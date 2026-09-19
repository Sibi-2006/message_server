import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const getTypeIcon = (type) => {
  switch (type) {
    case 'like':
      return '❤️';
    case 'comment':
      return '💬';
    case 'follow':
      return '👋';
    case 'message':
      return '✉️';
    case 'system':
    default:
      return '🔔';
  }
};

export default function Toast({ onPress }) {
  const { toastMessage, clearToast } = useNotifications();
  const { isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (toastMessage) {
      Animated.spring(slideAnim, {
        toValue: 50,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const dismissToast = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      clearToast();
    });
  };

  if (!toastMessage) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          dismissToast();
          if (onPress) onPress();
        }}
        activeOpacity={0.9}
        className={`p-4 rounded-2xl shadow-lg border flex-row items-center space-x-3 ${
          isDark
            ? 'bg-indigo-950 border-indigo-700 text-white'
            : 'bg-white border-indigo-200'
        }`}
      >
        <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center">
          <Text className="text-xl">{getTypeIcon(toastMessage.type)}</Text>
        </View>

        <View className="flex-1">
          <Text className={`font-semibold text-xs text-indigo-500 uppercase tracking-wider`}>
            New {toastMessage.type || 'Notification'}
          </Text>
          <Text
            numberOfLines={2}
            className={`text-sm font-medium ${
              isDark ? 'text-gray-100' : 'text-gray-800'
            }`}
          >
            {toastMessage.message}
          </Text>
        </View>

        <TouchableOpacity onPress={dismissToast} className="p-1">
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
