'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadStr = atob(payloadB64);
    return JSON.parse(payloadStr);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getCookie = (name: string): string | undefined => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      
      const token = getCookie('token');
      if (token) {
        const stored = localStorage.getItem('finsight-user');
        const payload = decodeJWT(token);
        
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch (err) {
            localStorage.removeItem('finsight-user');
          }
        } else if (payload) {
          // Gracefully fallback to decoding from JWT if localStorage was cleared
          setUser({
            id: String(payload.user_id),
            name: payload.name || (payload.role === 'Admin' ? 'Admin User' : payload.role === 'CFO' ? 'CFO User' : 'Analyst User'),
            email: payload.email || '',
            role: payload.role.toLowerCase() as any,
            avatar: payload.role === 'CFO' ? '👔' : payload.role === 'Admin' ? '⚙️' : '📊'
          });
        }
      } else {
        localStorage.removeItem('finsight-user');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      const { token, user: backendUser } = data;

      // Construct frontend user object with lowercase role matching our type definitions
      const frontendUser: User = {
        id: String(backendUser.user_id),
        name: backendUser.name,
        email: backendUser.email,
        role: backendUser.role.toLowerCase() as any,
        avatar: backendUser.role === 'CFO' ? '👔' : backendUser.role === 'Admin' ? '⚙️' : '📊'
      };

      setUser(frontendUser);

      if (typeof window !== 'undefined') {
        localStorage.setItem('finsight-user', JSON.stringify(frontendUser));
        // Set cookie read by Next.js middleware
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Clear localStorage & cookies
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finsight-user');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
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
