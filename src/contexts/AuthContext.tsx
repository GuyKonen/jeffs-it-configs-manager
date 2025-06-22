
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface CustomUser {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  microsoft_user_id?: string;
  role?: string;
  user_metadata?: any;
  auth_type: 'username' | 'entra';
}

interface AuthContextType {
  user: CustomUser | null;
  session: Session | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error?: string }>;
  signInWithEntra: (email: string, password: string) => Promise<{ error?: string }>;
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
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for username auth first
    const usernameAuth = localStorage.getItem('username_auth');
    if (usernameAuth) {
      const userData = JSON.parse(usernameAuth);
      setUser({
        id: userData.id,
        username: userData.username,
        role: userData.role,
        auth_type: 'username'
      });
      setLoading(false);
      return;
    }

    // Check for Entra auth
    const entraAuth = localStorage.getItem('entra_auth');
    if (entraAuth) {
      const userData = JSON.parse(entraAuth);
      setUser({
        id: userData.id,
        email: userData.email,
        role: userData.role,
        auth_type: 'entra'
      });
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const response = await supabase.functions.invoke('auth-username', {
        body: { username, password, action: 'login' }
      });

      if (response.error || !response.data?.success) {
        return { error: response.data?.error || 'Authentication failed' };
      }

      const userData = response.data.user;
      localStorage.setItem('username_auth', JSON.stringify(userData));
      
      setUser({
        id: userData.id,
        username: userData.username,
        role: userData.role,
        auth_type: 'username'
      });

      return {};
    } catch (error) {
      console.error('Username auth error:', error);
      return { error: 'Authentication failed' };
    }
  };

  const signInWithEntra = async (email: string, password: string) => {
    try {
      const response = await supabase.functions.invoke('entra-auth', {
        body: { email, password, action: 'login' }
      });

      if (response.error || !response.data?.success) {
        return { error: response.data?.error || 'Invalid Entra ID credentials' };
      }

      const userData = response.data.user;
      localStorage.setItem('entra_auth', JSON.stringify(userData));
      
      setUser({
        id: userData.id,
        email: userData.email,
        role: userData.role,
        auth_type: 'entra'
      });

      return {};
    } catch (error) {
      console.error('Entra auth error:', error);
      return { error: 'Authentication failed' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('username_auth');
    localStorage.removeItem('entra_auth');
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signInWithUsername,
    signInWithEntra,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
