
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Search, Settings, MessageSquare, Pin, ChevronDown } from 'lucide-react';

const ChatSidebar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');

  // Mock chat history data
  const chatHistory = [
    { id: 1, title: 'React Component Help', timestamp: '2 hours ago', pinned: true },
    { id: 2, title: 'Database Design Question', timestamp: '1 day ago', pinned: false },
    { id: 3, title: 'TypeScript Best Practices', timestamp: '2 days ago', pinned: false },
    { id: 4, title: 'API Integration Guide', timestamp: '3 days ago', pinned: false },
    { id: 5, title: 'CSS Grid Layout', timestamp: '1 week ago', pinned: false },
  ];

  const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3', label: 'Claude 3' },
    { value: 'llama-2', label: 'LLaMA 2' },
    { value: 'mistral-7b', label: 'Mistral 7B' },
  ];

  const filteredChats = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button 
          className="w-full justify-start gap-2 mb-4" 
          variant="default"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
        
        {/* Model Selection */}
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group"
            >
              <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium truncate">
                    {chat.title}
                  </p>
                  {chat.pinned && (
                    <Pin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {chat.timestamp}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
