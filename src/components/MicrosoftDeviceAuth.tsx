
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const MicrosoftDeviceAuth = () => {
  const { deviceCodeData, isPollingForAuth, startMicrosoftDeviceFlow, pollForMicrosoftAuth, stopPolling } = useAuth();
  const { toast } = useToast();

  const handleStartFlow = async () => {
    const result = await startMicrosoftDeviceFlow();
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Device Code Generated",
        description: "Please follow the instructions to complete authentication.",
      });
    }
  };

  const handleStartPolling = () => {
    pollForMicrosoftAuth();
    toast({
      title: "Waiting for Authentication",
      description: "Complete the authentication process in your browser.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const openVerificationUrl = () => {
    if (deviceCodeData?.verification_uri) {
      window.open(deviceCodeData.verification_uri, '_blank');
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  if (!deviceCodeData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Microsoft Authentication</CardTitle>
          <CardDescription>
            Sign in with your Microsoft account using Device Code Flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleStartFlow} className="w-full">
            Start Microsoft Sign-In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Complete Microsoft Sign-In</CardTitle>
        <CardDescription>
          Follow these steps to complete your authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            1. Go to this URL:
          </p>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs px-2 py-1 font-mono">
              {deviceCodeData.verification_uri}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={openVerificationUrl}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            2. Enter this code:
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Badge className="text-lg px-4 py-2 font-mono bg-primary text-primary-foreground">
              {deviceCodeData.user_code}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(deviceCodeData.user_code)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            3. Complete authentication in your browser, then click below:
          </p>
          
          {!isPollingForAuth ? (
            <Button onClick={handleStartPolling} className="w-full">
              I've Completed Authentication
            </Button>
          ) : (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Waiting for Confirmation...
            </Button>
          )}
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={stopPolling} className="w-full">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MicrosoftDeviceAuth;
