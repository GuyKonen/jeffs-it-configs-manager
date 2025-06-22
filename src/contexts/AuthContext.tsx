import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface CustomUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  user_metadata?: any;
  auth_type: 'supabase' | 'username' | 'entra';
}

interface AuthContextType {
  user: CustomUser | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithEntraID: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithUsername: (username: string, password: string) => Promise<{ error?: string }>;
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

    // Check for Entra ID auth
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

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
            auth_type: 'supabase'
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
          auth_type: 'supabase'
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signInWithMicrosoft = async () => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile openid'
      }
    });
    if (error) {
      console.error('Error signing in with Microsoft:', error);
    }
  };

  const signInWithEntraID = async (email: string, password: string) => {
    try {
      const response = await supabase.functions.invoke('entra-auth', {
        body: { email, password, action: 'login' }
      });

      if (response.error || !response.data?.success) {
        return { error: response.data?.error || 'Microsoft Entra ID authentication failed' };
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
      console.error('Entra ID auth error:', error);
      return { error: 'Microsoft Entra ID authentication failed' };
    }
  };

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

  const signOut = async () => {
    localStorage.removeItem('username_auth');
    localStorage.removeItem('entra_auth');
    
    if (session) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    }
    
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithEntraID,
    signInWithUsername,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
