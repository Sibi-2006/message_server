import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

export default function NotificationToast({ messageToast, clearMessageToast, onPress }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const player = useAudioPlayer(require('../../assets/sounds/notification.mp3'));

  useEffect(() => {
    // Play sound and animate in
    async function playSound() {
      try {
        player.play();
      } catch (e) {
        console.log('No sound played (add notification.mp3 to assets/sounds/):', e);
      }
    }

    if (messageToast) {
      playSound();
      Animated.timing(slideAnim, {
        toValue: 60, // Slide down to top: 60
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }).start();

      // Auto-hide after 3.5 seconds
      const timer = setTimeout(() => {
        closeToast();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [messageToast]);

  const closeToast = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      clearMessageToast();
    });
  };

  if (!messageToast) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        zIndex: 50,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          closeToast();
          if (onPress) onPress();
        }}
        activeOpacity={0.9}
        className="p-4 rounded-2xl bg-indigo-600 shadow-xl flex-row items-center space-x-3"
      >
        <Text className="text-2xl">💬</Text>
        <View className="flex-1">
          <Text className="text-white font-bold text-xs uppercase tracking-wider">
            {messageToast.senderName}
          </Text>
          <Text numberOfLines={1} className="text-white text-sm font-medium">
            {messageToast.text}
          </Text>
        </View>
        <TouchableOpacity onPress={closeToast}>
          <Text className="text-white text-xs">✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
