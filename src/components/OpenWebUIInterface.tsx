
import React, { useState, useEffect } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sessions from database on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const sessionsWithMessages = sessionsData?.map(session => ({
        id: session.id,
        title: session.title,
        timestamp: new Date(session.created_at),
        messages: messagesData?.filter(msg => msg.session_id === session.id).map(msg => ({
          id: msg.id,
          type: msg.type as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at)
        })) || []
      })) || [];

      setSessions(sessionsWithMessages);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async (firstMessage: string): Promise<string> => {
    try {
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ title })
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        id: data.id,
        title: data.title,
        messages: [],
        timestamp: new Date(data.created_at),
      };
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(data.id);
      setMessages([]);
      
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
      throw error;
    }
  };

  const saveMessage = async (sessionId: string, type: 'user' | 'assistant', content: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          type,
          content
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
    }
  };

  const handleMessageSent = async (userMessage: string, aiResponse: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    const aiMsg: Message = {
      id: `ai-${Date.now() + 1}`,
      type: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    
    const newMessages = [userMsg, aiMsg];
    
    // If no current session, create one
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession(userMessage);
    }
    
    // Update messages state
    setMessages(prev => [...prev, ...newMessages]);
    
    // Save messages to database
    await saveMessage(sessionId, 'user', userMessage);
    await saveMessage(sessionId, 'assistant', aiResponse);
    
    // Update session in sessions array
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, messages: [...session.messages, ...newMessages] }
        : session
    ));
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(247, 244, 237)' }}>
        <div className="text-lg">Loading chat history...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex" style={{ backgroundColor: 'rgb(247, 244, 237)' }}>
      {/* Left Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <ChatSidebar 
          onNewChat={handleNewChat}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
        />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} />
        </div>
        
        {/* Chat Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <ChatInput onMessageSent={handleMessageSent} />
        </div>
      </div>
    </div>
  );
};

export default OpenWebUIInterface;
