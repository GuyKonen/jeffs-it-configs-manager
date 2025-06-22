
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { signInWithUsername, signInWithEntra, user, loading } = useAuth();
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
    const { error } = await signInWithEntra(entraEmail, entraPassword);
    
    if (error) {
      toast({
        title: "Authentication Failed",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Entra ID.",
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
            <Tabs defaultValue="entra" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entra">Microsoft Entra</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
              
              <TabsContent value="entra" className="space-y-4 mt-4">
                <form onSubmit={handleEntraSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entra-email">Microsoft Email</Label>
                    <Input
                      id="entra-email"
                      type="email"
                      placeholder="your.name@company.com"
                      value={entraEmail}
                      onChange={(e) => setEntraEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entra-password">Password</Label>
                    <Input
                      id="entra-password"
                      type="password"
                      placeholder="Enter password"
                      value={entraPassword}
                      onChange={(e) => setEntraPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSigningIn}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    {isSigningIn ? 'Signing in...' : 'Sign in with Entra ID'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4 mt-4">
                <form onSubmit={handleUsernameSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Admin Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter admin username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
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
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSigningIn}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {isSigningIn ? 'Signing in...' : 'Sign in as Admin'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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
