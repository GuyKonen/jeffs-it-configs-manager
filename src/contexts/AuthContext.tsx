
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
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  console.log('🔍 DEBUG: Current hostname:', hostname);
  console.log('🔍 DEBUG: Current port:', port);
  console.log('🔍 DEBUG: Full location:', window.location.href);
  
  // If accessing via localhost with specific port, use direct backend port
  if (hostname === 'localhost' && port === '3000') {
    console.log('🔍 DEBUG: Using direct backend URL: http://localhost:3001');
    return 'http://localhost:3001';
  }
  
  // If accessing via localhost port 80 or no port, use proxy
  if (hostname === 'localhost') {
    console.log('🔍 DEBUG: Using proxy URL: http://localhost/api');
    return 'http://localhost/api';
  }
  
  // Default to relative API path
  console.log('🔍 DEBUG: Using relative API path: /api');
  return '/api';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for local auth in localStorage (for session persistence)
    const initializeAuth = async () => {
      try {
        console.log('🔍 DEBUG: Initializing auth...');
        const localAuth = localStorage.getItem('local_auth');
        if (localAuth) {
          console.log('🔍 DEBUG: Found local auth in localStorage:', localAuth);
          const userData = JSON.parse(localAuth);
          setUser(userData);
        } else {
          console.log('🔍 DEBUG: No local auth found in localStorage');
        }
      } catch (error) {
        console.error('❌ ERROR: Failed to initialize auth:', error);
      } finally {
        setLoading(false);
        console.log('🔍 DEBUG: Auth initialization complete');
      }
    };

    initializeAuth();
  }, []);

  const signInWithUsername = async (username: string, password: string, totpToken?: string) => {
    try {
      const apiUrl = getApiUrl();
      const fullUrl = `${apiUrl}/auth/login`;
      
      console.log('🔍 DEBUG: Starting login attempt...');
      console.log('🔍 DEBUG: Username:', username);
      console.log('🔍 DEBUG: API URL:', apiUrl);
      console.log('🔍 DEBUG: Full URL:', fullUrl);
      console.log('🔍 DEBUG: Has TOTP token:', !!totpToken);
      
      const requestBody = {
        username,
        password,
        totp_token: totpToken
      };
      
      console.log('🔍 DEBUG: Request body:', { ...requestBody, password: '[HIDDEN]' });
      
      console.log('🔍 DEBUG: Making fetch request...');
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔍 DEBUG: Response status:', response.status);
      console.log('🔍 DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));
      
      let data;
      try {
        const responseText = await response.text();
        console.log('🔍 DEBUG: Raw response text:', responseText);
        data = JSON.parse(responseText);
        console.log('🔍 DEBUG: Parsed response data:', data);
      } catch (parseError) {
        console.error('❌ ERROR: Failed to parse response as JSON:', parseError);
        return { error: 'Invalid response from server' };
      }

      if (!response.ok) {
        console.log('❌ ERROR: Response not OK. Status:', response.status);
        if (data.requires_totp) {
          console.log('🔍 DEBUG: TOTP required');
          return { requiresTotp: true };
        }
        console.log('❌ ERROR: Auth error:', data.error);
        return { error: data.error || 'Authentication failed' };
      }

      console.log('✅ SUCCESS: Login successful');
      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
        totp_enabled: data.totp_enabled
      };

      console.log('🔍 DEBUG: User data:', userData);
      localStorage.setItem('local_auth', JSON.stringify(userData));
      setUser(userData);

      return {};
    } catch (error: any) {
      console.error('❌ ERROR: Network/fetch error:', error);
      console.error('❌ ERROR: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { error: 'Network error - could not connect to server' };
    }
  };

  const signOut = async () => {
    console.log('🔍 DEBUG: Signing out...');
    localStorage.removeItem('local_auth');
    setUser(null);
    console.log('✅ SUCCESS: Signed out');
  };

  const value = {
    user,
    loading,
    signInWithUsername,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
