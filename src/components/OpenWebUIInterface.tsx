
import React, { useState } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';

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

  const createNewSession = (firstMessage?: string): string => {
    const newSessionId = `session-${Date.now()}`;
    const title = firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') : 'New Chat';
    
    const newSession: ChatSession = {
      id: newSessionId,
      title,
      messages: [],
      timestamp: new Date(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
    
    return newSessionId;
  };

  const handleMessageSent = (userMessage: string, aiResponse: string) => {
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
      sessionId = createNewSession(userMessage);
    }
    
    // Update messages state
    setMessages(prev => [...prev, ...newMessages]);
    
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

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
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
