
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Zap, MessageSquare, Cloud } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import UserManagement from '@/components/UserManagement';
import ConfigurationTabs from '@/components/ConfigurationTabs';
import ProxyFrame from '@/components/ProxyFrame';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Profile */}
        <UserProfile />

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Settings className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800">JeffFromIT</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            AI IT Assistant Configuration Dashboard
          </p>
          <p className="text-slate-500">
            Configure your API keys and settings to automate boring repetitive IT tasks
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:mx-auto">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
            <TabsTrigger value="n8n" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              N8N
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="azure" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Azure
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="mt-8">
            <ConfigurationTabs />
          </TabsContent>

          {user.role === 'admin' && (
            <TabsContent value="users" className="mt-8">
              <UserManagement />
            </TabsContent>
          )}

          <TabsContent value="n8n" className="mt-8">
            <ProxyFrame 
              url="http://localhost:5678/"
              title="N8N Workflow Automation"
              description="Access your N8N workflow automation interface"
              icon={Zap}
            />
          </TabsContent>

          <TabsContent value="chat" className="mt-8">
            <ProxyFrame 
              url="http://localhost:3000/"
              title="Chat Interface"
              description="Access your chat interface"
              icon={MessageSquare}
            />
          </TabsContent>

          <TabsContent value="azure" className="mt-8">
            <ProxyFrame 
              url="http://localhost:3000/"
              title="Azure Services"
              description="Access your Azure services interface"
              icon={Cloud}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pb-8">
          <p>JeffFromIT - Automating IT tasks so you don't have to</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
