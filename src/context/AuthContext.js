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

  const [userData, setUserData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userData')) || null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    try {
      if (!process.env.REACT_APP_API_LOGIN) {
        throw new Error('La URL de la API no está configurada');
      }
      const response = await fetch(process.env.REACT_APP_API_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setUserData(data.user);
        // Guardar los datos del usuario en localStorage
        try {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userData', JSON.stringify(data.user));
        } catch (error) {
          console.error('Error saving auth state:', error);
        }
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        message: 'Error al conectar con el servidor'
      };
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUserData(null);
    try {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Error removing auth state:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userData }}>
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