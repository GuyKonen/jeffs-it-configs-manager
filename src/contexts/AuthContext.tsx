
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
  auth_type: 'username' | 'microsoft';
}

interface DeviceCodeData {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface AuthContextType {
  user: CustomUser | null;
  session: Session | null;
  loading: boolean;
  deviceCodeData: DeviceCodeData | null;
  isPollingForAuth: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error?: string }>;
  startMicrosoftDeviceFlow: () => Promise<{ error?: string; deviceCodeData?: DeviceCodeData }>;
  pollForMicrosoftAuth: () => void;
  stopPolling: () => void;
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
  const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeData | null>(null);
  const [isPollingForAuth, setIsPollingForAuth] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

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

    // Check for Microsoft auth
    const microsoftAuth = localStorage.getItem('microsoft_auth');
    if (microsoftAuth) {
      const userData = JSON.parse(microsoftAuth);
      setUser({
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        microsoft_user_id: userData.microsoft_user_id,
        auth_type: 'microsoft'
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

  const startMicrosoftDeviceFlow = async () => {
    try {
      const response = await supabase.functions.invoke('microsoft-device-auth', {
        body: { action: 'start_device_flow' }
      });

      if (response.error || !response.data?.success) {
        return { error: response.data?.error || 'Failed to start device flow' };
      }

      const deviceData = {
        device_code: response.data.device_code,
        user_code: response.data.user_code,
        verification_uri: response.data.verification_uri,
        expires_in: response.data.expires_in,
        interval: response.data.interval
      };

      setDeviceCodeData(deviceData);
      return { deviceCodeData: deviceData };
    } catch (error) {
      console.error('Microsoft device flow error:', error);
      return { error: 'Failed to start device flow' };
    }
  };

  const pollForMicrosoftAuth = () => {
    if (!deviceCodeData || isPollingForAuth) return;

    setIsPollingForAuth(true);
    
    const poll = async () => {
      try {
        const response = await supabase.functions.invoke('microsoft-device-auth', {
          body: { 
            action: 'poll_token',
            device_code: deviceCodeData.device_code
          }
        });

        if (response.data?.success && response.data?.user) {
          // Authentication successful
          const userData = response.data.user;
          localStorage.setItem('microsoft_auth', JSON.stringify(userData));
          
          setUser({
            id: userData.id,
            email: userData.email,
            display_name: userData.display_name,
            microsoft_user_id: userData.microsoft_user_id,
            auth_type: 'microsoft'
          });

          stopPolling();
          setDeviceCodeData(null);
        } else if (response.data?.pending) {
          // Still waiting for user to authenticate
          console.log('Waiting for user authentication...');
        } else if (response.data?.error) {
          console.error('Authentication error:', response.data.error);
          stopPolling();
          setDeviceCodeData(null);
        }
      } catch (error) {
        console.error('Polling error:', error);
        stopPolling();
      }
    };

    // Start polling
    poll();
    const interval = setInterval(poll, (deviceCodeData.interval || 5) * 1000);
    setPollInterval(interval);

    // Stop polling after expiration
    setTimeout(() => {
      stopPolling();
      setDeviceCodeData(null);
    }, deviceCodeData.expires_in * 1000);
  };

  const stopPolling = () => {
    setIsPollingForAuth(false);
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('username_auth');
    localStorage.removeItem('microsoft_auth');
    stopPolling();
    setDeviceCodeData(null);
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    deviceCodeData,
    isPollingForAuth,
    signInWithUsername,
    startMicrosoftDeviceFlow,
    pollForMicrosoftAuth,
    stopPolling,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
