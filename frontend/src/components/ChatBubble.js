import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatMessageTime } from '../utils/constants';

export default function ChatBubble({ message, isOwnMessage, onDelete }) {
  const { isDark } = useTheme();

  return (
    <View className={`mb-3 flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <TouchableOpacity
        onLongPress={() => onDelete && onDelete(message._id)}
        activeOpacity={0.9}
        className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm ${
          isOwnMessage
            ? 'bg-indigo-600 rounded-br-none text-white'
            : isDark
            ? 'bg-gray-800 border border-gray-700/60 rounded-bl-none'
            : 'bg-white border border-gray-100 rounded-bl-none'
        }`}
      >
        {/* Message Text */}
        <Text
          className={`text-sm leading-5 font-medium ${
            isOwnMessage ? 'text-white' : isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          {message.text}
        </Text>

        {/* Footer: Time + Read Receipt Tick Status */}
        <View className="flex-row items-center justify-end space-x-1 mt-1">
          <Text
            className={`text-[10px] ${
              isOwnMessage
                ? 'text-indigo-200'
                : isDark
                ? 'text-gray-400'
                : 'text-gray-400'
            }`}
          >
            {formatMessageTime(message.createdAt)}
          </Text>

          {isOwnMessage && (
            <Text className="text-[11px] ml-1">
              {message.sending
                ? '🕒'
                : message.failed
                ? '⚠️'
                : message.isRead
                ? '✓✓' // Read double tick
                : '✓'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
