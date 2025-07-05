
import React, { useState } from 'react';
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
  const [selectedService, setSelectedService] = useState('general');
  const [activeTab, setActiveTab] = useState('interface');

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
      // Determine the endpoint based on selected service
      let endpoint = 'http://jeff-ai:8000/chat';
      if (selectedService === 'azure') {
        endpoint = 'http://jeff-ai:8000/azure';
      } else if (selectedService === 'okta') {
        endpoint = 'http://jeff-ai:8000/okta';
      } else if (selectedService === 'intune') {
        endpoint = 'http://jeff-ai:8000/intune';
      } else if (selectedService === 'activedirectory') {
        endpoint = 'http://jeff-ai:8000/ad';
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': 'web_user',
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
        content: data.output || data.response || 'No response received',
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
      {/* Main Header with Primary Tabs - Centered */}
      <div className="flex flex-col h-full w-full">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex justify-center">
            <div className="grid w-full grid-cols-3 max-w-md bg-muted rounded-md p-1">
              <button
                onClick={() => setActiveTab('interface')}
                className={`flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-base font-medium transition-all ${
                  activeTab === 'interface'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Interface
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-base font-medium transition-all ${
                  activeTab === 'config'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings className="h-4 w-4" />
                Config
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-base font-medium transition-all ${
                  activeTab === 'users'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Users
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Interface Tab with Sidebar */}
          {activeTab === 'interface' && (
            <div className="h-full w-full flex">
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
                    <div className="grid w-full grid-cols-5 gap-2">
                      <button
                        onClick={() => setSelectedService('general')}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          selectedService === 'general'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </button>
                      <button
                        onClick={() => setSelectedService('azure')}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          selectedService === 'azure'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Cloud className="h-4 w-4" />
                        Azure
                      </button>
                      <button
                        onClick={() => setSelectedService('okta')}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          selectedService === 'okta'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Shield className="h-4 w-4" />
                        Okta
                      </button>
                      <button
                        onClick={() => setSelectedService('intune')}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          selectedService === 'intune'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Smartphone className="h-4 w-4" />
                        Intune
                      </button>
                      <button
                        onClick={() => setSelectedService('activedirectory')}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          selectedService === 'activedirectory'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        Active Directory
                      </button>
                    </div>
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
            </div>
          )}

          {/* Config Tab - Full width with proper padding from top */}
          {activeTab === 'config' && (
            <div className="h-full w-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-full max-w-6xl mx-auto p-8">
                <ConfigurationTabs />
              </div>
            </div>
          )}

          {/* Users Tab - Positioned at the top */}
          {activeTab === 'users' && (
            <div className="h-full w-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-full max-w-6xl mx-auto p-8">
                <UserManagement />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenWebUIInterface;
