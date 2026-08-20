import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem('spendwise_token');
      const cachedUser = localStorage.getItem('spendwise_user');

      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        try {
          const { user: freshUser } = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('spendwise_user', JSON.stringify(freshUser));
        } catch (err) {
          // token invalid/expired - interceptor will redirect on next call
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  function persistSession(userData, token) {
    localStorage.setItem('spendwise_token', token);
    localStorage.setItem('spendwise_user', JSON.stringify(userData));
    setUser(userData);
  }

  async function login(email, password) {
    const { user: userData, token } = await authService.login({ email, password });
    persistSession(userData, token);
    return userData;
  }

  async function register(name, email, password, currency) {
    const { user: userData, token } = await authService.register({ name, email, password, currency });
    persistSession(userData, token);
    return userData;
  }

  function logout() {
    localStorage.removeItem('spendwise_token');
    localStorage.removeItem('spendwise_user');
    setUser(null);
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
    localStorage.setItem('spendwise_user', JSON.stringify(updatedUser));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
