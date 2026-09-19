import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      className={`p-2 rounded-full border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
      }`}
    >
      <Text className="text-base">{isDark ? '🌙' : '☀️'}</Text>
    </TouchableOpacity>
  );
}
