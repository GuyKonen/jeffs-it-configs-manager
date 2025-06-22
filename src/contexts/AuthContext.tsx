
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
  auth_type: 'username' | 'entra' | 'oidc';
}

interface AuthContextType {
  user: CustomUser | null;
  session: Session | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error?: string }>;
  signInWithEntra: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOIDC: () => Promise<{ error?: string; authUrl?: string }>;
  handleOIDCCallback: (code: string, state: string) => Promise<{ error?: string }>;
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

    // Check for OIDC auth
    const oidcAuth = localStorage.getItem('oidc_auth');
    if (oidcAuth) {
      const userData = JSON.parse(oidcAuth);
      setUser({
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        role: userData.role,
        auth_type: 'oidc'
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

  const signInWithOIDC = async () => {
    try {
      const response = await supabase.functions.invoke('oidc-auth', {
        body: { action: 'initiate' }
      });

      if (response.error || !response.data?.authUrl) {
        return { error: response.data?.error || 'Failed to initiate OIDC authentication' };
      }

      // Redirect to Microsoft OIDC
      window.location.href = response.data.authUrl;
      return {};
    } catch (error) {
      console.error('OIDC auth error:', error);
      return { error: 'Authentication failed' };
    }
  };

  const handleOIDCCallback = async (code: string, state: string) => {
    try {
      const response = await supabase.functions.invoke('oidc-auth', {
        body: { action: 'callback', code, state }
      });

      if (response.error || !response.data?.success) {
        return { error: response.data?.error || 'OIDC authentication failed' };
      }

      const userData = response.data.user;
      localStorage.setItem('oidc_auth', JSON.stringify(userData));
      
      setUser({
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        role: userData.role,
        auth_type: 'oidc'
      });

      return {};
    } catch (error) {
      console.error('OIDC callback error:', error);
      return { error: 'Authentication failed' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('username_auth');
    localStorage.removeItem('entra_auth');
    localStorage.removeItem('oidc_auth');
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signInWithUsername,
    signInWithEntra,
    signInWithOIDC,
    handleOIDCCallback,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
