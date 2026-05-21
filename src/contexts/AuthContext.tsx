import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { safeStorage } from '../lib/safeStorage';

export type UserRole = 'ADMIN' | 'USER' | 'ORGANIZER';
export type MembershipLevel = 'FREE' | 'PENDING' | 'PREMIUM';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  membership: MembershipLevel;
  membershipStatus: MembershipLevel;
  membershipExpiredAt?: string | null;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<any>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = safeStorage.getItem('auth_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return safeStorage.getItem('auth_token');
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !!safeStorage.getItem('auth_token');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Force loaded status after 1.5 seconds safety guard
    const safetyTimeout = setTimeout(() => setIsLoading(false), 1500);

    const initAuth = async () => {
      try {
        const storedUser = safeStorage.getItem('auth_user');
        const storedToken = safeStorage.getItem('auth_token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          
          // Verify user session state with backend in background
          try {
            const response = await api.get('/user/me');
            const latestUser = response.data;
            setUser(latestUser);
            safeStorage.setItem('auth_user', JSON.stringify(latestUser));
          } catch (apiError) {
            console.warn('Background auth status check failed:', apiError);
            // Non-critical, keep local session if it wasn't a 401 (interceptor handles 401)
          }
        } else {
          // If no stored credentials, clean state
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        safeStorage.removeItem('auth_user');
        safeStorage.removeItem('auth_token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: sessionUser, token: sessionToken } = response.data;

      setUser(sessionUser);
      setToken(sessionToken);
      safeStorage.setItem('auth_user', JSON.stringify(sessionUser));
      safeStorage.setItem('auth_token', sessionToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user: sessionUser, token: sessionToken } = response.data;

      setUser(sessionUser);
      setToken(sessionToken);
      safeStorage.setItem('auth_user', JSON.stringify(sessionUser));
      safeStorage.setItem('auth_token', sessionToken);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password: newPassword });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    safeStorage.removeItem('auth_user');
    safeStorage.removeItem('auth_token');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      safeStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/user/me');
      const latestUser = response.data;
      setUser(latestUser);
      safeStorage.setItem('auth_user', JSON.stringify(latestUser));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, forgotPassword, resetPassword, logout, updateUser, refreshUser }}>
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
