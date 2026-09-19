import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatRelativeTime } from '../utils/constants';
import Avatar from './Avatar';

export default function ConversationCard({ conversation, onPress }) {
  const { isDark } = useTheme();
  const otherUser = conversation.otherUser || { name: 'User', username: 'user' };
  const isOnline = otherUser.status === 'online';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={() => onPress(conversation)}
      activeOpacity={0.7}
      className={`p-4 mb-3 rounded-2xl border flex-row items-center space-x-3 ${
        hasUnread
          ? isDark
            ? 'bg-indigo-950/40 border-indigo-700/50'
            : 'bg-indigo-50/70 border-indigo-200'
          : isDark
          ? 'bg-gray-800/60 border-gray-700/60'
          : 'bg-white border-gray-100'
      }`}
    >
      <Avatar name={otherUser.name} isOnline={isOnline} />

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text
            className={`font-bold text-sm ${
              hasUnread
                ? isDark
                  ? 'text-white font-extrabold'
                  : 'text-gray-900 font-extrabold'
                : isDark
                ? 'text-gray-200'
                : 'text-gray-900'
            }`}
          >
            {otherUser.name}
          </Text>
          <Text className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
            {formatRelativeTime(conversation.lastMessageAt)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={1}
            className={`text-xs flex-1 mr-2 ${
              hasUnread
                ? isDark
                  ? 'text-indigo-300 font-semibold'
                  : 'text-indigo-700 font-semibold'
                : isDark
                ? 'text-gray-400'
                : 'text-gray-500'
            }`}
          >
            {conversation.lastMessage || 'No messages yet'}
          </Text>

          {hasUnread && (
            <View className="bg-indigo-600 rounded-full min-w-[20px] h-[20px] items-center justify-center px-1.5">
              <Text className="text-white text-[10px] font-bold">
                {conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
