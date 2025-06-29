import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { MessageSquare, Shield } from 'lucide-react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/utils/database';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  starred?: boolean;
}

type InterfaceMode = 'chat' | 'azure' | 'okta' | 'intune' | 'test';

const OpenWebUIInterface = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('chat');
  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  // Load chat sessions from database
  useEffect(() => {
    loadChatSessions();
  }, [user]);

  const loadChatSessions = async () => {
    if (!user) return;

    try {
      console.log('Loading chat sessions for user:', user.id);
      
      const dbSessions = await database.getChatSessions(user.id) as any[];
      const sessionsWithMessages = await Promise.all((dbSessions || []).map(async session => {
        const messages = ((await database.getMessages(session.id)) as any[]).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        return {
          id: session.id,
          title: session.title,
          messages,
          timestamp: new Date(session.timestamp),
          starred: session.starred || false
        };
      }));
      
      // Sort sessions: starred first, then by timestamp
      sessionsWithMessages.sort((a, b) => {
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      setSessions(sessionsWithMessages);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const handleNewChat = () => {
    console.log('Starting new chat');
    setCurrentSessionId(null);
    setCurrentMessages([]);
  };

  const handleSessionSelect = (sessionId: string) => {
    console.log('Selecting session:', sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setCurrentMessages(session.messages);
    }
  };

  const handleStarChat = async (sessionId: string) => {
    try {
      await database.starChatSession(sessionId);
      await loadChatSessions();
    } catch (error) {
      console.error('Error starring chat session:', error);
    }
  };

  const handleDownloadChat = (session: ChatSession) => {
    const chatData = {
      title: session.title,
      timestamp: session.timestamp,
      messages: session.messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteChat = async (sessionId: string) => {
    try {
      await database.deleteChatSession(sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setCurrentMessages([]);
      }
      await loadChatSessions();
    } catch (error) {
      console.error('Error deleting chat session:', error);
    }
  };

  const getEndpointUrl = (mode: InterfaceMode): string => {
    const baseUrl = 'http://localhost:8000';
    switch (mode) {
      case 'chat':
        return `${baseUrl}/chat`;
      case 'azure':
        return `${baseUrl}/azure`;
      case 'okta':
        return `${baseUrl}/okta`;
      case 'intune':
        return `${baseUrl}/intune`;
      case 'test':
        return `${baseUrl}/test`;
      default:
        return `${baseUrl}/chat`;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    console.log('Sending message:', content);
    setIsLoading(true);
    setLastUserMessage(content); // Store the last user message

    try {
      let sessionId = currentSessionId;

      // Create new session if none exists
      if (!sessionId) {
        console.log('Creating new session');
        sessionId = `session_${Date.now()}`;
        const newSession = {
          id: sessionId,
          user_id: user.id,
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString()
        };
        
        await database.createChatSession(newSession);
        setCurrentSessionId(sessionId);
        console.log('Created new session:', sessionId);
      }

      // Add user message
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'user',
        content,
        timestamp: new Date()
      };

      const newMessages = [...currentMessages, userMessage];
      setCurrentMessages(newMessages);

      // Save user message to database
      await database.createMessage({
        id: userMessage.id,
        session_id: sessionId,
        type: userMessage.type,
        content: userMessage.content,
        timestamp: userMessage.timestamp.toISOString()
      });

      // Send to the appropriate endpoint based on current mode
      try {
        const endpoint = getEndpointUrl(interfaceMode);
        console.log(`Sending to ${endpoint}:`, { message: content });
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response from service:', data);
        
        // Extract the output from the response structure
        let aiResponseContent = 'Sorry, I encountered an error processing your request.';
        if (data.status === 'success' && data.output) {
          aiResponseContent = data.output;
        } else if (data.response) {
          aiResponseContent = data.response;
        }
        
        // Add AI response
        const aiMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          type: 'assistant',
          content: aiResponseContent,
          timestamp: new Date()
        };

        const finalMessages = [...newMessages, aiMessage];
        setCurrentMessages(finalMessages);

        // Save AI message to database
        await database.createMessage({
          id: aiMessage.id,
          session_id: sessionId,
          type: aiMessage.type,
          content: aiMessage.content,
          timestamp: aiMessage.timestamp.toISOString()
        });

      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Add error message
        const errorMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          type: 'assistant',
          content: `Sorry, I'm having trouble connecting to the ${interfaceMode} service. Please make sure the service is running on localhost:8000.`,
          timestamp: new Date()
        };

        const finalMessages = [...newMessages, errorMessage];
        setCurrentMessages(finalMessages);

        // Save error message to database
        await database.createMessage({
          id: errorMessage.id,
          session_id: sessionId,
          type: errorMessage.type,
          content: errorMessage.content,
          timestamp: errorMessage.timestamp.toISOString()
        });
      }

      // Reload sessions to update the sidebar
      await loadChatSessions();

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-stone-50 flex flex-col">
      {/* Interface Mode Buttons */}
      <div className="bg-white border-b border-stone-200 p-4">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant={interfaceMode === 'chat' ? 'default' : 'outline'}
            onClick={() => setInterfaceMode('chat')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          <Button
            variant={interfaceMode === 'azure' ? 'default' : 'outline'}             
            onClick={() => setInterfaceMode('azure')}
            className="flex items-center gap-2"
          >
            <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            Azure
          </Button>
          <Button
            variant={interfaceMode === 'okta' ? 'default' : 'outline'}
            onClick={() => setInterfaceMode('okta')}
            className="flex items-center gap-2"
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">O</span>
            </div>
            Okta
          </Button>
          <Button
            variant={interfaceMode === 'intune' ? 'default' : 'outline'}
            onClick={() => setInterfaceMode('intune')}
            className="flex items-center gap-2"
          >
            <div className="w-4 h-4 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">I</span>
            </div>
            Intune
          </Button>
          <Button
            variant={interfaceMode === 'test' ? 'default' : 'outline'}
            onClick={() => setInterfaceMode('test')}
            className="flex items-center gap-2"
          >
            <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            Test
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-white border-r border-stone-200 flex flex-col">
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
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={80}>
            <div className="h-full bg-white">
              <ChatWindow
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                lastUserMessage={lastUserMessage}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default OpenWebUIInterface;
