
import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
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
}

const OpenWebUIInterface = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load chat sessions from database
  useEffect(() => {
    loadChatSessions();
  }, [user]);

  const loadChatSessions = async () => {
    if (!user) return;

    try {
      console.log('Loading chat sessions for user:', user.id);
      
      const dbSessions = await database.getChatSessions(user.id);
      const sessionsWithMessages = await Promise.all(dbSessions.map(async session => {
        const messages = (await database.getMessages(session.id)).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        return {
          id: session.id,
          title: session.title,
          messages,
          timestamp: new Date(session.timestamp)
        };
      }));
      
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

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    console.log('Sending message:', content);
    setIsLoading(true);

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

      // Send to AI API (localhost:8000)
      try {
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            conversation_id: sessionId
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Add AI response
        const aiMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          type: 'assistant',
          content: data.response || 'Sorry, I encountered an error processing your request.',
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
          content: 'Sorry, I\'m having trouble connecting to the AI service. Please make sure the server is running on localhost:8000.',
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
    <div className="h-screen bg-stone-50">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full bg-white border-r border-stone-200">
            <ChatSidebar
              onNewChat={handleNewChat}
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={75}>
          <div className="h-full bg-white">
            <ChatWindow
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default OpenWebUIInterface;
