
import React from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';

const OpenWebUIInterface = () => {
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <ChatSidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
        
        {/* Chat Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <ChatInput />
        </div>
      </div>
    </div>
  );
};

export default OpenWebUIInterface;
