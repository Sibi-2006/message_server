import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useMessaging } from '../context/MessagingContext';
import { useTheme } from '../context/ThemeContext';
import ConversationCard from '../components/ConversationCard';
import SkeletonLoader from '../components/SkeletonLoader';

export default function HomeScreen({ onOpenChat, onNavigateSearch }) {
  const { isDark } = useTheme();
  const { conversations, loadingConversations, fetchConversations } = useMessaging();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Top Search Bar Launcher */}
      <View className="px-4 py-3">
        <TouchableOpacity
          onPress={onNavigateSearch}
          activeOpacity={0.8}
          className={`p-3.5 rounded-2xl border flex-row items-center space-x-2 ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <Text className="text-base">🔍</Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
            Search friends by @username or #userId...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Conversation List */}
      <View className="flex-1 px-4 pt-1">
        {loadingConversations && conversations.length === 0 ? (
          <SkeletonLoader />
        ) : conversations.length === 0 ? (
          /* Empty State Design */
          <View className="flex-1 items-center justify-center py-16 px-6">
            <View className="w-24 h-24 rounded-3xl bg-indigo-500/10 items-center justify-center mb-4">
              <Text className="text-5xl">💬</Text>
            </View>
            <Text className={`text-xl font-bold mb-1 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No conversations yet
            </Text>
            <Text className={`text-xs text-center max-w-[260px] mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Search for friends by username or share your User ID to start chatting in real-time.
            </Text>
            <TouchableOpacity
              onPress={onNavigateSearch}
              activeOpacity={0.8}
              className="bg-indigo-600 px-6 py-3.5 rounded-2xl items-center shadow-lg shadow-indigo-600/30"
            >
              <Text className="text-white font-bold text-sm">Find Friends to Chat →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={({ item }) => (
              <ConversationCard
                conversation={item}
                onPress={() => onOpenChat(item)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDark ? '#818CF8' : '#6366F1'}
              />
            }
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </View>
    </View>
  );
}
