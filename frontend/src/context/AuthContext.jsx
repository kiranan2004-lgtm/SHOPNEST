import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('shopnest_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('shopnest_token'));
  const [loading, setLoading] = useState(true);

  // On mount, verify existing token by calling profile endpoint
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('shopnest_token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/profile/');
          setUser(response.data);
          localStorage.setItem('shopnest_user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Session expired or invalid token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { token: authToken, user: userData } = response.data;
      localStorage.setItem('shopnest_token', authToken);
      localStorage.setItem('shopnest_user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Login failed. Please check your credentials.';
      return { success: false, error: message };
    }
  };

  const register = async (formData) => {
    try {
      const response = await api.post('/auth/register/', formData);
      const { token: authToken, user: userData } = response.data;
      localStorage.setItem('shopnest_token', authToken);
      localStorage.setItem('shopnest_user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      let message = 'Registration failed. Please check input.';
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          // Format serializer field errors
          const firstKey = Object.keys(errors)[0];
          const val = errors[firstKey];
          message = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
        } else {
          message = String(errors);
        }
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout/');
      }
    } catch (error) {
      console.warn('Logout API warning:', error);
    } finally {
      localStorage.removeItem('shopnest_token');
      localStorage.removeItem('shopnest_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
