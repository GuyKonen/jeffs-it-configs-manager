
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Chrome, User, Building, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { signInWithGoogle, signInWithMicrosoft, signInWithUsername, signInWithEntraID, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [entraEmail, setEntraEmail] = useState('');
  const [entraPassword, setEntraPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleMicrosoftSignIn = async () => {
    await signInWithMicrosoft();
  };

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

    setIsSigningIn(true);
    const { error } = await signInWithUsername(username, password);
    
    if (error) {
      toast({
        title: "Authentication Failed",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "Successfully signed in.",
      });
    }
    setIsSigningIn(false);
  };

  const handleEntraSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entraEmail || !entraPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSigningIn(true);
    const { error } = await signInWithEntraID(entraEmail, entraPassword);
    
    if (error) {
      toast({
        title: "Entra ID Authentication Failed",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Microsoft Entra ID.",
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
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-primary rounded-full">
              <Settings className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">JeffFromIT</h1>
          </div>
          <p className="text-slate-600">
            Sign in to access your IT configuration dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="username" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="username">Username</TabsTrigger>
                <TabsTrigger value="entra">Entra ID</TabsTrigger>
              </TabsList>
              
              <TabsContent value="username" className="space-y-4 mt-4">
                <form onSubmit={handleUsernameSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSigningIn}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {isSigningIn ? 'Signing in...' : 'Sign in with Username'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="entra" className="space-y-4 mt-4">
                <form onSubmit={handleEntraSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entra-email">Email</Label>
                    <Input
                      id="entra-email"
                      type="email"
                      placeholder="Enter your Microsoft email"
                      value={entraEmail}
                      onChange={(e) => setEntraEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entra-password">Password</Label>
                    <Input
                      id="entra-password"
                      type="password"
                      placeholder="Enter your password"
                      value={entraPassword}
                      onChange={(e) => setEntraPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSigningIn}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isSigningIn ? 'Signing in...' : 'Sign in with Entra ID'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Button
                onClick={handleGoogleSignIn}
                className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                variant="outline"
              >
                <Chrome className="h-5 w-5 mr-3 text-blue-500" />
                Sign in with Google
              </Button>
              
              <Button
                onClick={handleMicrosoftSignIn}
                className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                variant="outline"
              >
                <Building className="h-5 w-5 mr-3 text-blue-600" />
                Sign in with Microsoft
              </Button>
            </div>
            
            <p className="text-sm text-slate-500 text-center mt-6">
              By signing in, you agree to securely store and manage your IT configurations
            </p>
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
