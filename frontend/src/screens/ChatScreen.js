import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateSeparator, formatRelativeTime } from '../utils/constants';
import Avatar from '../components/Avatar';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';

export default function ChatScreen({ conversation, targetUser, onBack }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const {
    messages,
    loadingMessages,
    fetchMessages,
    sendMessage,
    sendTyping,
    sendStopTyping,
    typingUsers,
    activeConversationId,
  } = useMessaging();

  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimerRef = useRef(null);
  const flatListRef = useRef(null);

  const recipient = targetUser || conversation?.otherUser || { name: 'User', username: 'user' };
  const currentUserId = user?.id || user?._id;
  const isOnline = recipient.status === 'online';
  const activeTypingSender = typingUsers[activeConversationId];

  useEffect(() => {
    if (conversation?._id) {
      fetchMessages(conversation._id);
    }
  }, [conversation?._id, fetchMessages]);

  const handleTextChange = (text) => {
    setInputMessage(text);
    if (!conversation?._id) return;

    sendTyping(conversation._id, recipient._id || recipient.id);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendStopTyping(conversation._id, recipient._id || recipient.id);
    }, 1500);
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || sending) return;
    const textToSend = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    if (conversation?._id) {
      sendStopTyping(conversation._id, recipient._id || recipient.id);
    }

    try {
      await sendMessage(recipient._id || recipient.id, textToSend);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  // Group messages by date for date headers
  const renderMessageItem = ({ item, index }) => {
    const isOwn = (item.senderId?._id || item.senderId).toString() === currentUserId?.toString();
    const currentDate = formatDateSeparator(item.createdAt);
    const prevDate = index > 0 ? formatDateSeparator(messages[index - 1].createdAt) : null;
    const showDateSeparator = currentDate !== prevDate;

    return (
      <View>
        {showDateSeparator && (
          <View className="items-center my-3">
            <View className={`px-3 py-1 rounded-full border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-200/70 border-gray-200'}`}>
              <Text className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentDate}
              </Text>
            </View>
          </View>
        )}
        <ChatBubble message={item} isOwnMessage={isOwn} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}
    >
      {/* Top Chat Navigation Bar */}
      <View
        className={`px-4 py-3 border-b flex-row items-center justify-between ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <TouchableOpacity onPress={onBack} className="p-1 mr-2">
          <Text className="text-xl">←</Text>
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center space-x-3">
          <Avatar name={recipient.name} isOnline={isOnline} size="sm" />
          <View>
            <Text className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {recipient.name}
            </Text>
            <Text className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isOnline ? '🟢 Online' : `Last seen ${formatRelativeTime(recipient.lastSeen)}`}
            </Text>
          </View>
        </View>

        {recipient.userId && (
          <View className="bg-indigo-500/10 px-2.5 py-1 rounded-full">
            <Text className="text-indigo-500 text-[10px] font-bold">#{recipient.userId}</Text>
          </View>
        )}
      </View>

      {/* Messages Feed Area */}
      <View className="flex-1 px-4 pt-2">
        {loadingMessages ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#6366F1" size="small" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderMessageItem}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        )}

        <TypingIndicator senderName={activeTypingSender} />
      </View>

      {/* Bottom Message Input Box */}
      <View
        className={`p-3 border-t flex-row items-center space-x-2 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <TextInput
          value={inputMessage}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
          multiline
          className={`flex-1 p-3 px-4 max-h-24 rounded-2xl border text-sm ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'
          }`}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputMessage.trim() || sending}
          activeOpacity={0.8}
          className={`w-11 h-11 rounded-2xl items-center justify-center ${
            inputMessage.trim() ? 'bg-indigo-600' : 'bg-indigo-400/40'
          }`}
        >
          {sending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white text-lg font-bold">↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
