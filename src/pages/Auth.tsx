
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { signInWithUsername, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleUsernameSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }

    if (requiresTotp && !totpToken) {
      toast({
        title: "TOTP Required",
        description: "Please enter your 6-digit TOTP code.",
        variant: "destructive",
      });
      return;
    }

    setIsSigningIn(true);
    const { error, requiresTotp: needsTotp } = await signInWithUsername(username, password, totpToken);
    
    if (needsTotp) {
      setRequiresTotp(true);
      toast({
        title: "TOTP Required",
        description: "Please enter your 6-digit authentication code.",
      });
    } else if (error) {
      toast({
        title: "Authentication Failed",
        description: error,
        variant: "destructive",
      });
      setRequiresTotp(false);
    } else {
      toast({
        title: "Welcome!",
        description: "Successfully signed in.",
      });
    }
    setIsSigningIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center space-y-6 mb-8">
          {/* New Logo */}
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/2202c54e-4a9d-4605-b06b-a57e8bf9139f.png" 
              alt="JeffFromIT Logo" 
              className="w-[300px] h-[300px] object-contain mix-blend-multiply opacity-90"
              style={{
                filter: 'brightness(1.1) contrast(1.1)',
                mixBlendMode: 'multiply'
              }}
            />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-800">JeffFromIT</h1>
          
          <p className="text-slate-600">
            Sign in to access your IT configuration dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your admin credentials {requiresTotp && '+ TOTP'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username/Password Login */}
            <form onSubmit={handleUsernameSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Admin Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={requiresTotp}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={requiresTotp}
                />
              </div>
              
              {requiresTotp && (
                <div className="space-y-2">
                  <Label htmlFor="totp">Authentication Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={totpToken}
                      onChange={(value) => setTotpToken(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={isSigningIn}
              >
                <User className="h-4 w-4 mr-2" />
                {isSigningIn ? 'Signing in...' : (requiresTotp ? 'Verify & Sign in' : 'Sign in as Admin')}
              </Button>
              
              {requiresTotp && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setRequiresTotp(false);
                    setTotpToken('');
                  }}
                >
                  Back to Login
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 mt-8">
          <p>JeffFromIT - Automating IT tasks so you don't have to</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
