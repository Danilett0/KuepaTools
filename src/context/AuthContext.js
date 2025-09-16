import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('isAuthenticated') === 'true';
    } catch {
      return false;
    }
  });

  const login = useCallback((password) => {
    const correctPassword = process.env.REACT_APP_LOGIN_PASSWORD;
    if (password === correctPassword) {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('isAuthenticated', 'true');
      } catch (error) {
        console.error('Error saving auth state:', error);
      }
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
      console.error('Error removing auth state:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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