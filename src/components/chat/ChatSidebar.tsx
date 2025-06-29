
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Search, MessageSquare, Plus, MoreHorizontal, Star, Download, Trash2 } from 'lucide-react';

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
  starred?: boolean;
}

interface ChatSidebarProps {
  onNewChat: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onStarChat: (sessionId: string) => void;
  onDownloadChat: (session: ChatSession) => void;
  onDeleteChat: (sessionId: string) => void;
}

const ChatSidebar = ({ 
  onNewChat, 
  sessions, 
  currentSessionId, 
  onSessionSelect,
  onStarChat,
  onDownloadChat,
  onDeleteChat
}: ChatSidebarProps) => {
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
              <ContextMenu key={session.id}>
                <ContextMenuTrigger asChild>
                  <div className="relative group mb-1">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start p-3 h-auto relative ${
                        currentSessionId === session.id 
                          ? 'bg-accent text-accent-foreground' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <div className="flex flex-col items-start w-full pr-8">
                        <div className="flex items-center gap-2 w-full">
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          {session.starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                          <span className="text-sm font-medium truncate flex-1">{session.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-6">
                          {session.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Three dots button - positioned absolutely and always visible */}
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div
                          className="h-6 w-6 flex items-center justify-center rounded hover:bg-background/80 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    </Button>
                  </div>
                </ContextMenuTrigger>
                
                <ContextMenuContent className="w-48">
                  <ContextMenuItem 
                    onClick={() => onStarChat(session.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Star className="h-4 w-4" />
                    {session.starred ? 'Unstar Chat' : 'Star Chat'}
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => onDownloadChat(session)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download Chat
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => onDeleteChat(session.id)}
                    className="flex items-center gap-2 text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Chat
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
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
