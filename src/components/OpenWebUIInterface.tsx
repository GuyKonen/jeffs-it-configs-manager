
import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
        return;
      }

      console.log('Loaded sessions:', sessionsData);

      if (sessionsData && sessionsData.length > 0) {
        // Process sessions one by one to avoid complex type inference
        const formattedSessions: ChatSession[] = [];
        
        for (const session of sessionsData) {
          const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          if (messagesError) {
            console.error('Error loading messages for session:', session.id, messagesError);
            formattedSessions.push({
              id: session.id,
              title: session.title || 'New Chat',
              messages: [],
              timestamp: new Date(session.created_at)
            });
            continue;
          }

          const formattedMessages: Message[] = messagesData?.map(msg => ({
            id: msg.id,
            type: msg.type as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          })) || [];

          formattedSessions.push({
            id: session.id,
            title: session.title || 'New Chat',
            messages: formattedMessages,
            timestamp: new Date(session.created_at)
          });
        }

        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error in loadChatSessions:', error);
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
        const { data: newSession, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            title: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          setIsLoading(false);
          return;
        }

        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        console.log('Created new session:', sessionId);
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content,
        timestamp: new Date()
      };

      setCurrentMessages(prev => [...prev, userMessage]);

      // Save user message to database
      const { error: userMessageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          type: 'user',
          content: content
        });

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
      }

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
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response || 'Sorry, I encountered an error processing your request.',
          timestamp: new Date()
        };

        setCurrentMessages(prev => [...prev, aiMessage]);

        // Save AI message to database
        const { error: aiMessageError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            type: 'assistant',
            content: aiMessage.content
          });

        if (aiMessageError) {
          console.error('Error saving AI message:', aiMessageError);
        }

      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: 'Sorry, I\'m having trouble connecting to the AI service. Please make sure the server is running on localhost:8000.',
          timestamp: new Date()
        };

        setCurrentMessages(prev => [...prev, errorMessage]);
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
