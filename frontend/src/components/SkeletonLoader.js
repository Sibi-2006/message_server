import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SkeletonLoader() {
  const { isDark } = useTheme();

  return (
    <View className="space-y-3">
      {[1, 2, 3, 4].map((key) => (
        <View
          key={key}
          className={`p-4 rounded-2xl border flex-row items-center space-x-3 opacity-60 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
          }`}
        >
          <View
            className={`w-12 h-12 rounded-2xl ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          />
          <View className="flex-1 space-y-2">
            <View
              className={`h-3 w-1/4 rounded ${
                isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            />
            <View
              className={`h-4 w-3/4 rounded ${
                isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
