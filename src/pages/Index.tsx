
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, MessageSquare, TestTube } from "lucide-react";
import ConfigurationTabs from "@/components/ConfigurationTabs";
import UserManagement from "@/components/UserManagement";
import ChatWindow from "@/components/chat/ChatWindow";
import ConnectionTest from "@/components/ConnectionTest";

const Index = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/414ac00c-0904-438a-b9cc-96ba875719a0.png" alt="JeffFromIT" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-slate-800">JeffFromIT</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Welcome, {user.username}</span>
              <Button onClick={signOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configuration</span>
            </TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>User Management</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="test" className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>Connection Test</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>
                  Chat with your AI assistant for IT support and automation tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatWindow />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure integrations and environment settings for your IT automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConfigurationTabs />
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === 'admin' && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="test" className="space-y-6">
            <ConnectionTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
