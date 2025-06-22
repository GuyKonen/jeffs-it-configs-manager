
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleOIDCCallback } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      toast({
        title: "Authentication Failed",
        description: "Microsoft authentication was cancelled or failed.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (code && state) {
      handleOIDCCallback(code, state).then(({ error }) => {
        if (error) {
          toast({
            title: "Authentication Failed",
            description: error,
            variant: "destructive",
          });
          navigate('/auth');
        } else {
          toast({
            title: "Welcome!",
            description: "Successfully signed in with Microsoft.",
          });
          navigate('/');
        }
      });
    } else {
      navigate('/auth');
    }
  }, [location, handleOIDCCallback, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-lg">Processing Microsoft authentication...</div>
    </div>
  );
};

export default AuthCallback;
