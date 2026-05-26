import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('bizmanager-token');
    const savedUser = localStorage.getItem('bizmanager-user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Validate token with backend
        api.get('/auth/me').then(res => {
          const userData = res.data;
          setUser(userData);
          localStorage.setItem('bizmanager-user', JSON.stringify(userData));
        }).catch(() => {
          // Token invalid
          localStorage.removeItem('bizmanager-token');
          localStorage.removeItem('bizmanager-user');
          setUser(null);
        }).finally(() => setLoading(false));
      } catch {
        localStorage.removeItem('bizmanager-token');
        localStorage.removeItem('bizmanager-user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('bizmanager-token', token);
    localStorage.setItem('bizmanager-user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async ({ email, password, name, businessName, inviteCode }) => {
    const res = await api.post('/auth/register', {
      email, password, name, businessName, inviteCode
    });
    const { token, user: userData } = res.data;
    localStorage.setItem('bizmanager-token', token);
    localStorage.setItem('bizmanager-user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('bizmanager-token');
    localStorage.removeItem('bizmanager-user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isOwner: user?.role === 'owner',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
