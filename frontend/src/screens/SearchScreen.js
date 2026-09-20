import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';

export default function SearchScreen({ onSelectUser, onBack }) {
  const { token, apiUrl } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true; // prevent default behavior (exit app)
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data.users || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header Search Input */}
      <View
        className={`px-4 pt-4 pb-3 border-b flex-row items-center space-x-3 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <TouchableOpacity onPress={onBack} className="p-1">
          <Text className="text-xl">←</Text>
        </TouchableOpacity>

        <View
          className={`flex-1 flex-row items-center px-3.5 py-2.5 rounded-2xl border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
          }`}
        >
          <Text className="text-sm mr-2">🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Search @username or #userId..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results List */}
      <View className="flex-1 px-4 pt-4">
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#6366F1" size="small" />
            <Text className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Searching users...
            </Text>
          </View>
        ) : results.length === 0 && !!query.trim() ? (
          <View className="py-16 items-center">
            <Text className="text-4xl mb-2">🔍</Text>
            <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No users found
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Try searching by exact @username or unique #userId
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelectUser(item)}
                activeOpacity={0.7}
                className={`p-4 mb-3 rounded-2xl border flex-row items-center justify-between ${
                  isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
                }`}
              >
                <View className="flex-row items-center space-x-3">
                  <Avatar name={item.name} isOnline={item.status === 'online'} />

                  <View>
                    <Text className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.name}
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      @{item.username}
                    </Text>
                  </View>
                </View>

                <View className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl flex-row items-center space-x-1">
                  <Text className="text-indigo-500 text-xs font-bold">#{item.userId}</Text>
                  <Text className="text-xs">💬</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
