import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function TypingIndicator({ senderName }) {
  const { isDark } = useTheme();

  if (!senderName) return null;

  return (
    <View className="flex-row items-center space-x-2 my-2 ml-2">
      <View
        className={`px-3.5 py-2 rounded-2xl rounded-bl-none border flex-row items-center space-x-1.5 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
        }`}
      >
        <Text className={`text-xs font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
          {senderName} is typing
        </Text>
        <Text className="text-xs animate-bounce">✍️</Text>
      </View>
    </View>
  );
}
