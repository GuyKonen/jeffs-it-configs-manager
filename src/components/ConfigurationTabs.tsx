
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Key, Zap, MessageSquare, Cloud, Download, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ConfigurationTabs = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [configs, setConfigs] = useState({
    // N8N Configuration
    N8N_ENCRYPTION_KEY: '',
    N8N_USER_MANAGEMENT_JWT_SECRET: '',
    N8N_USER_MANAGEMENT_DISABLED: false,
    N8N_DIAGNOSTICS_ENABLED: false,
    N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: true,
    N8N_RUNNERS_ENABLED: true,
    
    // Open WebUI Configuration
    AUTO_CONTINUE_PROMPTS: false,
    ENABLE_CONVERSATION_TEMPLATES: false,
    OPEN_WEBUI_EMAIL: 'admin@admin.com',
    OPEN_WEBUI_PASSWORD: 'Shalom123!',
    
    // Azure MCP Configuration
    AZURE_TENANT_ID: '',
    AZURE_CLIENT_ID: '',
    AZURE_CLIENT_SECRET: '',
    
    // Azure OpenAI Configuration
    AZURE_OPENAI_URL: '',
    AZURE_OPENAI_API_KEY: '',
    AZURE_OPENAI_API_VERSION: '',
    AZURE_OPENAI_MODEL_NAME: '',
    
    // Slack Configuration
    SLACK_ACCESS_TOKEN: '',
  });

  const handleInputChange = (key: string, value: string | boolean) => {
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
      const { data, error } = await supabase.functions.invoke('update-env', {
        body: { configs }
      });

      if (error) {
        throw error;
      }

      // Create and download the .env file
      if (data?.envFile) {
        const blob = new Blob([data.envFile], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '.env';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Configuration Saved",
        description: "Environment variables updated and .env file downloaded successfully.",
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

  return (
    <div className="space-y-8">
      {/* N8N Configuration */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-orange-500" />
            <CardTitle className="text-xl">N8N Workflow Automation</CardTitle>
          </div>
          <CardDescription>
            Configure N8N settings for workflow automation and user management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n8n-encryption">Encryption Key</Label>
              <Input
                id="n8n-encryption"
                type="password"
                placeholder="Enter N8N encryption key"
                value={configs.N8N_ENCRYPTION_KEY}
                onChange={(e) => handleInputChange('N8N_ENCRYPTION_KEY', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n8n-jwt">JWT Secret</Label>
              <Input
                id="n8n-jwt"
                type="password"
                placeholder="Enter JWT secret"
                value={configs.N8N_USER_MANAGEMENT_JWT_SECRET}
                onChange={(e) => handleInputChange('N8N_USER_MANAGEMENT_JWT_SECRET', e.target.value)}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>User Management</Label>
                <p className="text-sm text-muted-foreground">Disable user management features</p>
              </div>
              <Switch
                checked={configs.N8N_USER_MANAGEMENT_DISABLED}
                onCheckedChange={(checked) => handleInputChange('N8N_USER_MANAGEMENT_DISABLED', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Diagnostics</Label>
                <p className="text-sm text-muted-foreground">Enable diagnostic reporting</p>
              </div>
              <Switch
                checked={configs.N8N_DIAGNOSTICS_ENABLED}
                onCheckedChange={(checked) => handleInputChange('N8N_DIAGNOSTICS_ENABLED', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>File Permissions</Label>
                <p className="text-sm text-muted-foreground">Enforce settings file permissions</p>
              </div>
              <Switch
                checked={configs.N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS}
                onCheckedChange={(checked) => handleInputChange('N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Runners</Label>
                <p className="text-sm text-muted-foreground">Enable N8N runners</p>
              </div>
              <Switch
                checked={configs.N8N_RUNNERS_ENABLED}
                onCheckedChange={(checked) => handleInputChange('N8N_RUNNERS_ENABLED', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open WebUI Configuration */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6 text-purple-500" />
            <CardTitle className="text-xl">Open WebUI Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure Open WebUI interface settings and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="webui-email">Admin Email</Label>
              <Input
                id="webui-email"
                type="email"
                placeholder="admin@admin.com"
                value={configs.OPEN_WEBUI_EMAIL}
                onChange={(e) => handleInputChange('OPEN_WEBUI_EMAIL', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webui-password">Admin Password</Label>
              <Input
                id="webui-password"
                type="password"
                placeholder="Enter admin password"
                value={configs.OPEN_WEBUI_PASSWORD}
                onChange={(e) => handleInputChange('OPEN_WEBUI_PASSWORD', e.target.value)}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Continue Prompts</Label>
                <p className="text-sm text-muted-foreground">Automatically continue prompts</p>
              </div>
              <Switch
                checked={configs.AUTO_CONTINUE_PROMPTS}
                onCheckedChange={(checked) => handleInputChange('AUTO_CONTINUE_PROMPTS', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Conversation Templates</Label>
                <p className="text-sm text-muted-foreground">Enable conversation templates</p>
              </div>
              <Switch
                checked={configs.ENABLE_CONVERSATION_TEMPLATES}
                onCheckedChange={(checked) => handleInputChange('ENABLE_CONVERSATION_TEMPLATES', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Label htmlFor="azure-tenant">Azure Tenant ID</Label>
              <Input
                id="azure-tenant"
                placeholder="Enter your Azure tenant ID"
                value={configs.AZURE_TENANT_ID}
                onChange={(e) => handleInputChange('AZURE_TENANT_ID', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-client-id">Azure Client ID</Label>
              <Input
                id="azure-client-id"
                placeholder="Enter your Azure client ID"
                value={configs.AZURE_CLIENT_ID}
                onChange={(e) => handleInputChange('AZURE_CLIENT_ID', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-client-secret">Azure Client Secret</Label>
              <Input
                id="azure-client-secret"
                type="password"
                placeholder="Enter your Azure client secret"
                value={configs.AZURE_CLIENT_SECRET}
                onChange={(e) => handleInputChange('AZURE_CLIENT_SECRET', e.target.value)}
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
              <Label htmlFor="azure-url">Azure OpenAI URL</Label>
              <Input
                id="azure-url"
                placeholder="https://your-resource.openai.azure.com/"
                value={configs.AZURE_OPENAI_URL}
                onChange={(e) => handleInputChange('AZURE_OPENAI_URL', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-key">API Key</Label>
              <Input
                id="azure-key"
                type="password"
                placeholder="Enter Azure OpenAI API key"
                value={configs.AZURE_OPENAI_API_KEY}
                onChange={(e) => handleInputChange('AZURE_OPENAI_API_KEY', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-version">API Version</Label>
              <Input
                id="azure-version"
                placeholder="2024-02-01"
                value={configs.AZURE_OPENAI_API_VERSION}
                onChange={(e) => handleInputChange('AZURE_OPENAI_API_VERSION', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-model">Model Name</Label>
              <Input
                id="azure-model"
                placeholder="gpt-4"
                value={configs.AZURE_OPENAI_MODEL_NAME}
                onChange={(e) => handleInputChange('AZURE_OPENAI_MODEL_NAME', e.target.value)}
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
              Updating...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Save & Download .env File
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConfigurationTabs;
