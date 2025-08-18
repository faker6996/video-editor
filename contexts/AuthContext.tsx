"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/models/user';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/utils/local-storage';
import { callApi } from '@/lib/utils/api-client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { HTTP_METHOD_ENUM } from '@/lib/constants/enum';

interface AuthContextType {
  user: User | null;
  login: (user: User, token?: string | null) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // Skip auth check if on login/register/public pages
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isPublicPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(path => 
        currentPath.includes(path)
      );
      
      if (isPublicPage) {
        setLoading(false);
        return;
      }
      
      const cachedUser = loadFromLocalStorage<User>('user', User);

      if (cachedUser) {
        setUser(cachedUser);
      }
      
      // Always try to verify with server (token in cookie)
      try {
        const freshUser = await callApi<User>(API_ROUTES.AUTH.ME, HTTP_METHOD_ENUM.GET, undefined, { silent: true });
        if (freshUser) {
          setUser(freshUser);
          saveToLocalStorage('user', freshUser);
        }
      } catch (error) {
        // Only logout if we had a cached user (user was previously logged in)
        if (cachedUser) {
          console.error("Session validation failed, logging out.", error);
          logout();
        } else {
          // First time visitors without cached user - this is expected
          console.log("No valid session found, user needs to login");
        }
      }
      
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = (newUser: User, token?: string | null) => {
    setUser(newUser);
    saveToLocalStorage('user', newUser);
    if (token) {
      saveToLocalStorage('token', token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Token is in cookie, will be cleared by logout API
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
