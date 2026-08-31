import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profileImage, setProfileImage] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = useState(true);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load user profile on mount / token change
  const refreshProfile = async () => {
    if (!token) {
      setUser(null);
      setProfileImage(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await api.getProfile();
      setUser(prev => ({ ...prev, ...profile }));
      localStorage.setItem('user', JSON.stringify(profile));

      const imgRes = await api.getProfileImage().catch(() => null);
      if (imgRes && imgRes.profile_image) {
        setProfileImage(imgRes.profile_image);
      }
    } catch (err) {
      console.warn("Failed to load profile, logging out:", err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = (jwtToken, username, isAdmin) => {
    localStorage.setItem('token', jwtToken);
    const initialUser = { username, is_admin: isAdmin };
    localStorage.setItem('user', JSON.stringify(initialUser));
    setToken(jwtToken);
    setUser(initialUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setProfileImage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        profileImage,
        setProfileImage,
        theme,
        toggleTheme,
        login,
        logout,
        refreshProfile,
        loading,
        isAuthenticated: !!token,
        isAdmin: user?.is_admin === 1,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
