
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, RotateCcw, User, Send, Mic, Plus, Square } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

const ChatWindow = ({ messages, onSendMessage, isLoading }: ChatWindowProps) => {
  const [inputMessage, setInputMessage] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const messageToSend = inputMessage.trim();
    setInputMessage('');
    await onSendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    // Add stop functionality here if needed
  };

  return (
    <div className="h-full bg-background flex flex-col relative">
      {/* Chat Content */}
      <div className="flex-1 relative min-h-0">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-4 pb-32">
            {messages.length === 0 ? (
              // Welcome Message (when no messages)
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground text-2xl font-bold">AI</span>
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Chat Assistant</h2>
                <p className="text-muted-foreground">How can I help you today?</p>
              </div>
            ) : (
              // Chat Messages
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-4">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-muted' 
                        : 'bg-primary'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <span className="text-primary-foreground text-sm font-bold">AI</span>
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {message.type === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-foreground whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      
                      {/* Message Actions - Only Copy and Regenerate */}
                      {message.type === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                            onClick={() => copyToClipboard(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Regenerate
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed Input Area - positioned absolutely at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How can I help you today?"
                className="min-h-[60px] max-h-[200px] pr-16 pl-12 resize-none border-border bg-background focus:border-primary focus:ring-primary"
                disabled={isLoading}
              />
              
              {/* Left side button */}
              <div className="absolute left-3 bottom-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              
              {/* Right side buttons */}
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  disabled={isLoading}
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </Button>
                
                {isLoading ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={handleStop}
                  >
                    <Square className="h-4 w-4 text-muted-foreground" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${
                      inputMessage.trim() 
                        ? 'text-primary hover:bg-muted' 
                        : 'text-muted-foreground cursor-not-allowed'
                    }`}
                    onClick={handleSend}
                    disabled={!inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Status indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>AI is generating a response...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
