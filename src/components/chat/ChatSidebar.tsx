
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, Search, Plus, MessageSquare, Settings, User } from 'lucide-react';

const ChatSidebar = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock chat history data matching the style
  const todayChats = [
    { id: 1, title: 'test', active: false },
    { id: 2, title: 'test', active: false },
  ];

  const recentChats = [
    { id: 3, title: 'Azure AD Assistant Test', active: false },
    { id: 4, title: 'Azure Login Help', active: false },
    { id: 5, title: 'Azure Assistant Introduction', active: false },
    { id: 6, title: 'Azure Command Test', active: true },
  ];

  const yesterdayChats = [
    { id: 7, title: 'Azure Assistant Test', active: false },
    { id: 8, title: 'hello', active: false },
    { id: 9, title: 'test', active: false },
  ];

  const olderChats = [
    { id: 10, title: 'Network Operations Center O', active: false },
    { id: 11, title: 'Azure VM Details', active: false },
    { id: 12, title: 'Azure Subscription Not Found', active: false },
    { id: 13, title: 'Azure AD User List', active: false },
    { id: 14, title: 'Azure Assistant Test', active: false },
  ];

  const renderChatItem = (chat: any) => (
    <div
      key={chat.id}
      className={`flex items-center gap-3 p-2 mx-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
        chat.active ? 'bg-gray-100 dark:bg-gray-700' : ''
      }`}
    >
      <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
        {chat.title}
      </span>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Menu className="h-5 w-5 text-gray-600" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">OI</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">New Chat</span>
          </div>
        </div>
        
        {/* Model Selection */}
        <Select defaultValue="azure">
          <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="azure">Azure</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="claude-3">Claude 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 p-2 text-sm text-gray-600 dark:text-gray-400">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </div>
          <div className="flex items-center gap-3 p-2 text-sm text-gray-600 dark:text-gray-400">
            <MessageSquare className="h-4 w-4" />
            <span>Notes</span>
          </div>
          <div className="flex items-center gap-3 p-2 text-sm text-gray-600 dark:text-gray-400">
            <Settings className="h-4 w-4" />
            <span>Workspace</span>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Today */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 mb-2">Today</h3>
            {todayChats.map(renderChatItem)}
          </div>

          {/* Recent */}
          <div className="mb-4">
            {recentChats.map(renderChatItem)}
          </div>

          {/* Yesterday */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 mb-2">Yesterday</h3>
            {yesterdayChats.map(renderChatItem)}
          </div>

          {/* Previous 7 days */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 mb-2">Previous 7 days</h3>
            {olderChats.map(renderChatItem)}
          </div>
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">admin</span>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
