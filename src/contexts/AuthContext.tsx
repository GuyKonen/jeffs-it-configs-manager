
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
  auth_type: 'username' | 'saml';
}

interface AuthContextType {
  user: CustomUser | null;
  session: Session | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error?: string }>;
  signInWithSAML: () => Promise<{ error?: string }>;
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
    // Check for username auth
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

    // Check for SAML auth
    const samlAuth = localStorage.getItem('saml_auth');
    if (samlAuth) {
      const userData = JSON.parse(samlAuth);
      setUser({
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        role: userData.role,
        auth_type: 'saml'
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

  const signInWithSAML = async () => {
    try {
      const response = await supabase.functions.invoke('saml-auth', {
        body: { returnUrl: window.location.origin }
      });

      if (response.error) {
        return { error: 'SAML authentication failed' };
      }

      const { redirectUrl } = response.data;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return {};
      }

      return { error: 'No redirect URL received' };
    } catch (error) {
      console.error('SAML auth error:', error);
      return { error: 'SAML authentication failed' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('username_auth');
    localStorage.removeItem('saml_auth');
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signInWithUsername,
    signInWithSAML,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
