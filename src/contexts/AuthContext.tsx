

import React, { createContext, useContext, useEffect, useState } from 'react';
import { database } from '@/utils/database';

interface LocalUser {
  id: string;
  username: string;
  role: string;
  totp_enabled?: boolean;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string, totpToken?: string) => Promise<{ error?: string; requiresTotp?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize database and check for local auth
    const initializeAuth = async () => {
      try {
        await database.init();
        
        // Check for local auth in localStorage (for session persistence)
        const localAuth = localStorage.getItem('local_auth');
        if (localAuth) {
          const userData = JSON.parse(localAuth);
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signInWithUsername = async (username: string, password: string, totpToken?: string) => {
    try {
      const foundUser: any = await database.getUserByCredentials(username, password, totpToken);
      
      if (!foundUser) {
        return { error: 'Invalid username or password' };
      }

      const userData = {
        id: foundUser.id,
        username: foundUser.username,
        role: foundUser.role,
        totp_enabled: foundUser.totp_enabled
      };

      localStorage.setItem('local_auth', JSON.stringify(userData));
      setUser(userData);

      return {};
    } catch (error: any) {
      console.error('Local auth error:', error);
      if (error.message === 'TOTP_REQUIRED') {
        return { requiresTotp: true };
      }
      return { error: 'Authentication failed' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('local_auth');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signInWithUsername,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

