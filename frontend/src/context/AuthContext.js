/**
 * AuthContext — DriveCare
 *
 * Provides:
 *   - isAuthenticated: boolean
 *   - login(token, user): saves to AsyncStorage + updates state
 *   - logout(): clears AsyncStorage + updates state → triggers navigation to Login
 *
 * The NavigationContainer in App.js reads `isAuthenticated` to decide
 * which stack to show, so logout is instant and protected routes become
 * unreachable without any manual navigation.replace() calls.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [user, setUser] = useState(null);

  // ─── Restore session on app start ──────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const timeout = setTimeout(() => setIsBootstrapping(false), 5000);
      try {
        const token      = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (token) {
          setIsAuthenticated(true);
          if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
          }
        }
      } catch (err) {
        console.error('[Auth] Failed to restore session:', err.message);
      } finally {
        clearTimeout(timeout);
        setIsBootstrapping(false);
      }
    };
    restore();
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (token, userData) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('[Auth] Failed to persist session:', err.message);
    }
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
    } catch (err) {
      console.error('[Auth] Failed to clear session:', err.message);
    }
    setUser(null);
    setIsAuthenticated(false);
    // Flipping isAuthenticated → false causes AppNavigator to render AuthStack
    // (Login screen) automatically — no navigation.replace() needed anywhere.
  }, []);

  // ─── Wire 401 interceptor → logout ──────────────────────────────────────────
  // Any API call that gets a 401 (expired/invalid token) will call logout(),
  // which clears storage and flips isAuthenticated → Login screen appears.
  useEffect(() => {
    api.setLogoutCallback(logout);
    return () => api.setLogoutCallback(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isBootstrapping, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
