
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

const OpenWebUIInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);

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
    
    setMessages(prev => [...prev, userMsg, aiMsg]);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <ChatSidebar onNewChat={handleNewChat} />
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
