import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Settings, Users, Cloud, Shield, Smartphone } from 'lucide-react';
import ChatWindow from './chat/ChatWindow';
import ChatSidebar from './chat/ChatSidebar';
import ConfigurationTabs from './ConfigurationTabs';
import UserManagement from './UserManagement';
import { Message, ChatSession } from '@/types/chat';

const OpenWebUIInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    setLastUserMessage(message);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: data.response || 'No response received',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const handleStarChat = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, starred: !session.starred }
        : session
    ));
  };

  const handleDownloadChat = (session: ChatSession) => {
    const dataStr = JSON.stringify(session, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `chat-${session.title}-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleDeleteChat = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <Tabs defaultValue="interface" className="flex h-full w-full">
        {/* Main Header with Primary Tabs - Centered */}
        <div className="flex flex-col h-full w-full">
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex justify-center">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="interface" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Interface
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Config
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Interface Tab with Sidebar */}
            <TabsContent value="interface" className="m-0 h-full w-full flex">
              {/* Sidebar */}
              <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <ChatSidebar 
                  onNewChat={handleNewChat}
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSessionSelect={handleSessionSelect}
                  onStarChat={handleStarChat}
                  onDownloadChat={handleDownloadChat}
                  onDeleteChat={handleDeleteChat}
                />
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                <div className="h-full flex flex-col">
                  {/* Service Selection Tabs */}
                  <div className="bg-white border-b border-slate-200 px-6 py-4">
                    <Tabs defaultValue="general" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Chat
                        </TabsTrigger>
                        <TabsTrigger value="azure" className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" />
                          Azure
                        </TabsTrigger>
                        <TabsTrigger value="okta" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Okta
                        </TabsTrigger>
                        <TabsTrigger value="intune" className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Intune
                        </TabsTrigger>
                        <TabsTrigger value="activedirectory" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Active Directory
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  {/* Chat Interface */}
                  <div className="flex-1">
                    <ChatWindow 
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                      lastUserMessage={lastUserMessage}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Config Tab without Sidebar */}
            <TabsContent value="config" className="m-0 h-full w-full overflow-auto">
              <div className="p-6">
                <ConfigurationTabs />
              </div>
            </TabsContent>

            {/* Users Tab without Sidebar */}
            <TabsContent value="users" className="m-0 h-full w-full overflow-auto">
              <div className="p-6">
                <UserManagement />
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default OpenWebUIInterface;
