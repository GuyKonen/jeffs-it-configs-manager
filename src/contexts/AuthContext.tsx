
import React, { createContext, useContext, useEffect, useState } from 'react';

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

// Get API URL from environment or use default
const getApiUrl = () => {
  // In Docker, the backend service is accessible via internal network
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // If accessing via localhost, use the exposed port
    return 'http://localhost:3001';
  }
  // If accessing via Docker network or nginx proxy, use the proxy
  return '/api';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for local auth in localStorage (for session persistence)
    const initializeAuth = async () => {
      try {
        const localAuth = localStorage.getItem('local_auth');
        if (localAuth) {
          const userData = JSON.parse(localAuth);
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signInWithUsername = async (username: string, password: string, totpToken?: string) => {
    try {
      const apiUrl = getApiUrl();
      console.log('Making auth request to:', `${apiUrl}/auth/login`);
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          totp_token: totpToken
        }),
      });

      const data = await response.json();
      console.log('Auth response:', data);

      if (!response.ok) {
        if (data.requires_totp) {
          return { requiresTotp: true };
        }
        return { error: data.error || 'Authentication failed' };
      }

      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
        totp_enabled: data.totp_enabled
      };

      localStorage.setItem('local_auth', JSON.stringify(userData));
      setUser(userData);

      return {};
    } catch (error: any) {
      console.error('Auth request error:', error);
      return { error: 'Network error - could not connect' };
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
