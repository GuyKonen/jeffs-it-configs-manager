
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import UserManagement from '@/components/UserManagement';
import ConfigurationTabs from '@/components/ConfigurationTabs';
import OpenWebUIInterface from '@/components/OpenWebUIInterface';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Header */}
        <div className="text-center space-y-2 px-6 py-4 bg-card border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center space-x-3 flex-1">
              <div className="p-2 bg-primary rounded-full">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">JeffFromIT</h1>
            </div>
            {/* Compact User Profile in top right */}
            <div className="w-64">
              <UserProfile />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="config" className="w-full">
          <div className="px-6 bg-card border-b border-border">
            <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:mx-auto bg-muted">
              <TabsTrigger value="config" className="flex items-center gap-2 data-[state=active]:bg-card">
                <Settings className="h-4 w-4" />
                Config
              </TabsTrigger>
              {user.role === 'admin' && (
                <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-card">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
              )}
              <TabsTrigger value="azure" className="flex items-center gap-2 data-[state=active]:bg-card">
                <img src="/azure-icon.png" alt="Azure" className="h-4 w-4" />
                Azure
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="config" className="mt-0 px-6 max-w-6xl mx-auto bg-card min-h-screen pt-4">
            <ConfigurationTabs />
          </TabsContent>

          {user.role === 'admin' && (
            <TabsContent value="users" className="mt-0 px-6 max-w-6xl mx-auto bg-card min-h-screen pt-4">
              <UserManagement />
            </TabsContent>
          )}

          <TabsContent value="azure" className="mt-0 bg-card min-h-screen">
            <OpenWebUIInterface />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
