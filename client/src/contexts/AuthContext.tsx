import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

type UserRole = 'student' | 'tutor' | 'admin';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface TempAuth {
  tempToken: string;
  userId: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isVerifying: boolean;
  user: User | null;
  showTOTP: boolean;
  tempAuth: TempAuth | null;
  login: (username: string, password: string) => Promise<void>;
  verifyTOTP: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [showTOTP, setShowTOTP] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tempAuth, setTempAuth] = useState<TempAuth | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      
      // After successful login, store the temporary token and show TOTP verification
      setTempAuth({
        tempToken: data.tempToken,
        userId: data.user.id
      });
      setShowTOTP(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const verifyTOTP = async (code: string) => {
    if (!tempAuth) {
      throw new Error('No temporary authentication data');
    }

    try {
      const response = await apiRequest('POST', '/api/auth/verify-totp', {
        token: tempAuth.tempToken,
        code
      });
      
      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
      setShowTOTP(false);
      setTempAuth(null);
      
      // Redirect based on role
      redirectToRoleDashboard(data.user.role);
    } catch (error) {
      console.error('TOTP verification error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      setIsAuthenticated(false);
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data = await response.json();
      
      // After registration, redirect to login
      setLocation('/login');
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const redirectToRoleDashboard = (role: UserRole) => {
    switch (role) {
      case 'student':
        setLocation('/student/dashboard');
        break;
      case 'tutor':
        setLocation('/tutor/dashboard');
        break;
      case 'admin':
        setLocation('/admin/dashboard');
        break;
      default:
        setLocation('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isVerifying,
        user,
        showTOTP,
        tempAuth,
        login,
        verifyTOTP,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
