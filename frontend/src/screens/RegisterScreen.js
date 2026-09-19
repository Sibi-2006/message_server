import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function RegisterScreen({ onNavigateLogin }) {
  const { register } = useAuth();
  const { isDark } = useTheme();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(name.trim(), username.trim().toLowerCase(), email.trim(), password.trim());
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View className="flex-row justify-end mb-4">
          <ThemeToggle />
        </View>

        <View
          className={`p-6 rounded-3xl border shadow-xl ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}
        >
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-2xl bg-indigo-600/20 items-center justify-center mb-3">
              <Text className="text-3xl">✨</Text>
            </View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create Account
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Get a unique shareable User ID upon sign up
            </Text>
          </View>

          {!!error && (
            <View className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <Text className="text-red-500 text-xs font-medium text-center">{error}</Text>
            </View>
          )}

          <View className="space-y-3.5 mb-6">
            <View>
              <Text className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Full Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Alex Morgan"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`p-3.5 rounded-2xl border text-sm ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </View>

            <View>
              <Text className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Username (Unique handle)
              </Text>
              <TextInput
                value={username}
                onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, ''))}
                autoCapitalize="none"
                placeholder="alex_m"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`p-3.5 rounded-2xl border text-sm ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </View>

            <View>
              <Text className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="alex@example.com"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`p-3.5 rounded-2xl border text-sm ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </View>

            <View>
              <Text className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="At least 6 characters"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`p-3.5 rounded-2xl border text-sm ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
            className="bg-indigo-600 p-4 rounded-2xl items-center shadow-md shadow-indigo-600/30"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white font-bold text-base">Create Account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-6 space-x-1">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={onNavigateLogin}>
              <Text className="text-xs font-bold text-indigo-600">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
