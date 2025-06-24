
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, Key, Zap, MessageSquare, Cloud, Save, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ConfigurationTabs = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [configs, setConfigs] = useState({
    // Azure MCP Configuration
    AZURE_MCP_SERVER_URL: '',
    AZURE_CLIENT_ID: '',
    AZURE_CLIENT_SECRET: '',
    
    // Slack Configuration
    SLACK_ACCESS_TOKEN: '',
    
    // Okta Configuration
    OKTA_CLIENT_ORGURL: '',
    OKTA_API_TOKEN: '',
    
    // Azure OpenAI Configuration
    OPENAI_RESOURCE_NAME: '',
    OPENAI_API_KEY: '',
    OPENAI_API_VERSION: '',
    OPENAI_DEPLOYMENT_NAME: '',
    OPENAI_MODEL: '',
    
    AZURE_TENANT_ID: '',
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/env-config');
      if (response.ok) {
        const data = await response.json();
        setConfigs(prevConfigs => ({
          ...prevConfigs,
          ...data
        }));
      } else {
        console.error('Failed to load configurations');
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load configurations from server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save configurations.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:3001/api/env-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configs })
      });

      if (!response.ok) {
        throw new Error('Failed to save configurations');
      }

      const data = await response.json();

      toast({
        title: "Configuration Saved",
        description: "Environment variables updated successfully.",
      });
      
      console.log('Configuration saved successfully:', data);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Save Failed",
        description: "Failed to update environment variables. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading configurations...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Azure MCP Configuration */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Cloud className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-xl">Azure MCP</CardTitle>
          </div>
          <CardDescription>
            Configure Azure MCP settings for cloud integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="azure-mcp-url">Azure MCP Server URL</Label>
              <Input
                id="azure-mcp-url"
                placeholder="Enter Azure MCP server URL"
                value={configs.AZURE_MCP_SERVER_URL}
                onChange={(e) => handleInputChange('AZURE_MCP_SERVER_URL', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-mcp-client-id">Azure Client ID</Label>
              <Input
                id="azure-mcp-client-id"
                placeholder="Enter your Azure client ID"
                value={configs.AZURE_CLIENT_ID}
                onChange={(e) => handleInputChange('AZURE_CLIENT_ID', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-mcp-client-secret">Azure Client Secret</Label>
              <Input
                id="azure-mcp-client-secret"
                type="password"
                placeholder="Enter your Azure client secret"
                value={configs.AZURE_CLIENT_SECRET}
                onChange={(e) => handleInputChange('AZURE_CLIENT_SECRET', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slack Configuration */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-green-500" />
            <CardTitle className="text-xl">Slack Integration</CardTitle>
          </div>
          <CardDescription>
            Configure Slack access for notifications and communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="slack-token">Slack Access Token</Label>
            <Input
              id="slack-token"
              type="password"
              placeholder="xoxb-your-slack-access-token"
              value={configs.SLACK_ACCESS_TOKEN}
              onChange={(e) => handleInputChange('SLACK_ACCESS_TOKEN', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Get your Slack access token from your Slack app configuration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Okta Configuration */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-6 w-6 text-orange-500" />
            <CardTitle className="text-xl">Okta Integration</CardTitle>
          </div>
          <CardDescription>
            Configure Okta settings for identity management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="okta-org-url">Okta Organization URL</Label>
              <Input
                id="okta-org-url"
                placeholder="https://your-org.okta.com"
                value={configs.OKTA_CLIENT_ORGURL}
                onChange={(e) => handleInputChange('OKTA_CLIENT_ORGURL', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="okta-api-token">Okta API Token</Label>
              <Input
                id="okta-api-token"
                type="password"
                placeholder="Enter Okta API token"
                value={configs.OKTA_API_TOKEN}
                onChange={(e) => handleInputChange('OKTA_API_TOKEN', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Azure OpenAI Configuration */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Cloud className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-xl">Azure OpenAI</CardTitle>
          </div>
          <CardDescription>
            Configure Azure OpenAI API settings for AI-powered automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openai-resource">OpenAI Resource Name</Label>
              <Input
                id="openai-resource"
                placeholder="your-openai-resource"
                value={configs.OPENAI_RESOURCE_NAME}
                onChange={(e) => handleInputChange('OPENAI_RESOURCE_NAME', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="Enter Azure OpenAI API key"
                value={configs.OPENAI_API_KEY}
                onChange={(e) => handleInputChange('OPENAI_API_KEY', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-version">API Version</Label>
              <Input
                id="openai-version"
                placeholder="2024-02-01"
                value={configs.OPENAI_API_VERSION}
                onChange={(e) => handleInputChange('OPENAI_API_VERSION', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-deployment">Deployment Name</Label>
              <Input
                id="openai-deployment"
                placeholder="your-deployment-name"
                value={configs.OPENAI_DEPLOYMENT_NAME}
                onChange={(e) => handleInputChange('OPENAI_DEPLOYMENT_NAME', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-model">Model Name</Label>
              <Input
                id="openai-model"
                placeholder="gpt-4"
                value={configs.OPENAI_MODEL}
                onChange={(e) => handleInputChange('OPENAI_MODEL', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-tenant-id">Azure Tenant ID</Label>
              <Input
                id="azure-tenant-id"
                placeholder="Enter your Azure tenant ID"
                value={configs.AZURE_TENANT_ID}
                onChange={(e) => handleInputChange('AZURE_TENANT_ID', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="px-8 py-3 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg"
        >
          {saving ? (
            <>
              <Key className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConfigurationTabs;
