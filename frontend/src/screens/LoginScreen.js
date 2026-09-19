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

export default function LoginScreen({ onNavigateRegister }) {
  const { login, apiUrl, updateApiUrl } = useAuth();
  const { isDark } = useTheme();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(apiUrl);

  const handleLogin = async () => {
    if (!loginInput.trim() || !password.trim()) {
      setError('Please enter email/username and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await login(loginInput.trim(), password.trim());
    } catch (err) {
      setError(err.message || 'Login failed. Check server URL and credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = () => {
    if (serverUrlInput.trim()) {
      updateApiUrl(serverUrlInput.trim());
      setShowSettings(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            className={`p-2 px-3 rounded-full border ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <Text className="text-xs font-semibold">⚙️ Backend IP</Text>
          </TouchableOpacity>

          <ThemeToggle />
        </View>

        {showSettings && (
          <View
            className={`p-4 mb-6 rounded-2xl border ${
              isDark ? 'bg-gray-900 border-indigo-900/50' : 'bg-indigo-50/50 border-indigo-200'
            }`}
          >
            <Text className={`text-xs font-bold mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Backend API Base URL
            </Text>
            <TextInput
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              placeholder="e.g. http://192.168.1.10:5000"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              className={`p-3 rounded-xl border text-sm mb-3 ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <TouchableOpacity
              onPress={handleSaveApiUrl}
              className="bg-indigo-600 p-2.5 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-xs">Save URL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Login Card */}
        <View
          className={`p-6 rounded-3xl border shadow-xl ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}
        >
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-2xl bg-indigo-600/20 items-center justify-center mb-3">
              <Text className="text-3xl">💬</Text>
            </View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Messenger Sign In
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Chat instantly with friends in real-time
            </Text>
          </View>

          {!!error && (
            <View className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <Text className="text-red-500 text-xs font-medium text-center">{error}</Text>
            </View>
          )}

          <View className="space-y-4 mb-6">
            <View>
              <Text className={`text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email or Username
              </Text>
              <TextInput
                value={loginInput}
                onChangeText={setLoginInput}
                autoCapitalize="none"
                placeholder="alex or alex@example.com"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`p-3.5 rounded-2xl border text-sm ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </View>

            <View>
              <Text className={`text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`p-3.5 rounded-2xl border text-sm ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            className="bg-indigo-600 p-4 rounded-2xl items-center shadow-md shadow-indigo-600/30"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white font-bold text-base">Sign In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-6 space-x-1">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={onNavigateRegister}>
              <Text className="text-xs font-bold text-indigo-600">Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
