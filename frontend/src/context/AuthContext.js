import React, { createContext, useContext, useState, useEffect } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/apiConfig';
import { wakeUpServer } from '../utils/wakeUpServer';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customApiUrl, setCustomApiUrl] = useState(API_BASE_URL);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const getActiveApiUrl = () => customApiUrl || API_BASE_URL;

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      const storedUser = await AsyncStorage.getItem('@auth_user');
      const savedUrl = await AsyncStorage.getItem('@custom_api_url');

      if (savedUrl) setCustomApiUrl(savedUrl);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    } finally {
      setLoading(false);
    }
  };

  const updateApiUrl = async (url) => {
    setCustomApiUrl(url);
    await AsyncStorage.setItem('@custom_api_url', url);
  };

  const login = async (loginInput, password) => {
    // Ensure the backend is awake before attempting login
    await wakeUpServer();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
    try {
      const res = await fetch(`${getActiveApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginInput, password }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      await AsyncStorage.setItem('@auth_token', data.token);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(data.user));
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const register = async (name, username, email, password) => {
    // Ensure backend is awake before attempting registration
    await wakeUpServer();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
    try {
      const res = await fetch(`${getActiveApiUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const err = new Error(data.message || 'Registration failed');
        err.status = res.status;
        throw err;
      }
      setToken(data.token);
      setUser(data.user);
      await AsyncStorage.setItem('@auth_token', data.token);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(data.user));
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        apiUrl: getActiveApiUrl(),
        updateApiUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
