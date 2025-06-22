
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, MessageSquare, Cloud } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full">
        {/* Smaller User Profile */}
        <div className="p-4">
          <UserProfile />
        </div>

        {/* Header */}
        <div className="text-center space-y-2 px-6 pb-4">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="p-2 bg-primary rounded-full">
              <Settings className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">JeffFromIT</h1>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="config" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:mx-auto">
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
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="azure" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Azure
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="config" className="mt-4 px-6">
            <ConfigurationTabs />
          </TabsContent>

          {user.role === 'admin' && (
            <TabsContent value="users" className="mt-4 px-6">
              <UserManagement />
            </TabsContent>
          )}

          <TabsContent value="chat" className="mt-4">
            <ProxyFrame 
              url="http://localhost:3000/"
              title="Chat Interface"
              description="Access your chat interface"
              icon={MessageSquare}
              fullScreen={true}
            />
          </TabsContent>

          <TabsContent value="azure" className="mt-4">
            <ProxyFrame 
              url="http://localhost:3000/"
              title="Azure Services"
              description="Access your Azure services interface"
              icon={Cloud}
              fullScreen={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
