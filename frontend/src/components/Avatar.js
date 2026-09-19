import React from 'react';
import { View, Text } from 'react-native';

const colors = [
  'bg-indigo-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
];

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getColorClass = (name) => {
  if (!name) return colors[0];
  let charSum = 0;
  for (let i = 0; i < name.length; i++) charSum += name.charCodeAt(i);
  return colors[charSum % colors.length];
};

export default function Avatar({ name, size = 'md', isOnline = false, showStatus = true }) {
  const initials = getInitials(name);
  const colorBg = getColorClass(name);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl text-xs',
    md: 'w-12 h-12 rounded-2xl text-base',
    lg: 'w-16 h-16 rounded-3xl text-xl',
  };

  const dotSizes = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3.5 h-3.5 border-2',
    lg: 'w-4.5 h-4.5 border-2',
  };

  return (
    <View className="relative">
      <View
        className={`${sizeClasses[size] || sizeClasses.md} ${colorBg} items-center justify-center shadow-sm`}
      >
        <Text className="text-white font-bold">{initials}</Text>
      </View>

      {showStatus && (
        <View
          className={`absolute bottom-0 right-0 ${
            dotSizes[size] || dotSizes.md
          } rounded-full ${
            isOnline ? 'bg-green-500 border-white dark:border-gray-900' : 'bg-gray-400 border-white dark:border-gray-900'
          }`}
        />
      )}
    </View>
  );
}
