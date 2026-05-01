import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export type UserRole = 'ADMIN' | 'USER';
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
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Force non-blocking render after 2 seconds no matter what
    const safetyTimeout = setTimeout(() => setIsLoading(false), 2000);

    const initAuth = async () => {
      try {
        // Check for stored session
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        // Clear corrupt data
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
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
      localStorage.setItem('auth_user', JSON.stringify(sessionUser));
      localStorage.setItem('auth_token', sessionToken);
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
      localStorage.setItem('auth_user', JSON.stringify(sessionUser));
      localStorage.setItem('auth_token', sessionToken);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/user/me');
      const latestUser = response.data;
      setUser(latestUser);
      localStorage.setItem('auth_user', JSON.stringify(latestUser));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser, refreshUser }}>
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
