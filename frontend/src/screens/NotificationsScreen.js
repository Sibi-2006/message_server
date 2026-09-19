import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import NotificationCard from '../components/NotificationCard';
import SkeletonLoader from '../components/SkeletonLoader';
import NotificationDetailModal from './NotificationDetailModal';

export default function NotificationsScreen({ onNavigateHome }) {
  const { isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

  const handleSelectNotification = (item) => {
    setSelectedNotification(item);
    if (!item.isRead) {
      markAsRead(item._id);
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Subheader Controls */}
      <View
        className={`px-4 py-3 border-b flex-row items-center justify-between ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        {/* Navigation back home */}
        <TouchableOpacity
          onPress={onNavigateHome}
          className="flex-row items-center space-x-1"
        >
          <Text className="text-base">←</Text>
          <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Filter Tabs */}
        <View className="flex-row bg-gray-200/50 dark:bg-gray-800 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg ${
              activeTab === 'all'
                ? 'bg-indigo-600 shadow-sm'
                : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'all'
                  ? 'text-white'
                  : isDark
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}
            >
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('unread')}
            className={`px-3 py-1 rounded-lg ${
              activeTab === 'unread'
                ? 'bg-indigo-600 shadow-sm'
                : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'unread'
                  ? 'text-white'
                  : isDark
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mark All As Read Button */}
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text className="text-xs font-bold text-indigo-600">Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-16" />
        )}
      </View>

      {/* Main List Area */}
      <View className="flex-1 px-4 pt-4">
        {loading && notifications.length === 0 ? (
          <SkeletonLoader />
        ) : filteredNotifications.length === 0 ? (
          /* Empty State Design */
          <View className="flex-1 items-center justify-center py-16 px-6">
            <View className="w-24 h-24 rounded-full bg-indigo-500/10 items-center justify-center mb-4">
              <Text className="text-5xl">📭</Text>
            </View>
            <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
            <Text className={`text-xs text-center max-w-[250px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {activeTab === 'unread'
                ? 'You are all caught up! Check back later for new alerts.'
                : 'When you receive likes, comments, or system alerts, they will appear right here.'}
            </Text>
          </View>
        ) : (
          /* Notification Items List */
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={handleSelectNotification}
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

      {/* Detail Modal */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </View>
  );
}
