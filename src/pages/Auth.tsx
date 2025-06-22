
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Chrome, User, Building, Cloud } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { signInWithGoogle, signInWithMicrosoft, signInWithUsername, signInWithAzure, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [azureEmail, setAzureEmail] = useState('');
  const [azurePassword, setAzurePassword] = useState('');
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

  const handleAzureSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!azureEmail || !azurePassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSigningIn(true);
    const { error } = await signInWithAzure(azureEmail, azurePassword);
    
    if (error) {
      toast({
        title: "Azure Authentication Failed",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Azure.",
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
                <TabsTrigger value="azure">Azure</TabsTrigger>
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

              <TabsContent value="azure" className="space-y-4 mt-4">
                <form onSubmit={handleAzureSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="azure-email">Email</Label>
                    <Input
                      id="azure-email"
                      type="email"
                      placeholder="Enter your Azure email"
                      value={azureEmail}
                      onChange={(e) => setAzureEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="azure-password">Password</Label>
                    <Input
                      id="azure-password"
                      type="password"
                      placeholder="Enter your Azure password"
                      value={azurePassword}
                      onChange={(e) => setAzurePassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSigningIn}
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    {isSigningIn ? 'Signing in...' : 'Sign in with Azure'}
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
