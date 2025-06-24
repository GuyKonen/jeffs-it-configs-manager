
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageSquare, Plus } from 'lucide-react';

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
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        {/* Start New Chat Button */}
        <Button 
          onClick={onNewChat}
          className="w-full flex items-center gap-2 justify-center mb-4 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Start New Chat
        </Button>
        
        {/* Model Selection */}
        <Select defaultValue="azure">
          <SelectTrigger className="w-full bg-muted border-border">
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
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        {filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
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
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 w-full">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{session.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">
                    {session.timestamp.toLocaleDateString()}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">J</span>
          </div>
          <span className="text-sm font-medium text-foreground">Jeff</span>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
