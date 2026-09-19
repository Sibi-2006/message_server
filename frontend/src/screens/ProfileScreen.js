import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import ThemeToggle from '../components/ThemeToggle';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`} contentContainerStyle={{ padding: 20 }}>
      {/* Profile Header Card */}
      <View
        className={`p-6 rounded-3xl border items-center mb-6 shadow-sm ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <Avatar name={user?.name || 'User'} size="lg" isOnline />
        <Text className={`text-xl font-bold mt-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user?.name || 'Alex Morgan'}
        </Text>
        <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          @{user?.username || 'alex_m'}
        </Text>

        {/* Shareable Unique User ID Badge */}
        <View className="mt-4 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-2xl flex-row items-center space-x-2">
          <Text className="text-xs font-semibold text-indigo-400">Shareable ID:</Text>
          <Text className="text-sm font-extrabold text-indigo-500">#{user?.userId || 'SB4821'}</Text>
        </View>
      </View>

      {/* Settings Card */}
      <View
        className={`p-5 rounded-3xl border mb-6 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <Text className={`text-xs font-bold uppercase tracking-wider text-indigo-500 mb-4`}>
          Preferences & Settings
        </Text>

        <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <View>
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Appearance Theme
            </Text>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isDark ? 'Dark Mode active' : 'Light Mode active'}
            </Text>
          </View>
          <ThemeToggle />
        </View>

        <View className="flex-row items-center justify-between py-3">
          <View>
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Email Address
            </Text>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Action Button */}
      <TouchableOpacity
        onPress={() => {
          Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
          ]);
        }}
        activeOpacity={0.8}
        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 items-center"
      >
        <Text className="text-red-500 font-bold text-base">Log Out Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
