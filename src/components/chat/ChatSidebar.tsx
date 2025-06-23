
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, Search, MessageSquare, Settings } from 'lucide-react';

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

interface ChatSidebarProps {
  onNewChat: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
}

const ChatSidebar = ({ onNewChat, sessions, currentSessionId, onSessionSelect }: ChatSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Menu className="h-5 w-5 text-gray-600" />
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 p-0 hover:bg-transparent"
            onClick={onNewChat}
          >
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">Jeff</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">New Chat</span>
          </Button>
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
        {filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chat history</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredSessions.map((session) => (
              <Button
                key={session.id}
                variant="ghost"
                className={`w-full justify-start p-3 mb-1 h-auto ${
                  currentSessionId === session.id 
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 w-full">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{session.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                    {session.timestamp.toLocaleDateString()}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        )}
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
