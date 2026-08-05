'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { MOCK_USERS } from './mock-data';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('finsight-user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (err) {
          localStorage.removeItem('finsight-user');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const matchedUser = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );
      
      if (matchedUser) {
        const { password: _, ...userWithoutPassword } = matchedUser;
        setUser(userWithoutPassword);
        if (typeof window !== 'undefined') {
          localStorage.setItem('finsight-user', JSON.stringify(userWithoutPassword));
        }
      } else {
        throw new Error('Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finsight-user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
