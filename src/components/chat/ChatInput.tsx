
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, Plus, Square } from 'lucide-react';

interface ChatInputProps {
  onMessageSent: (userMessage: string, aiResponse: string) => void;
}

const ChatInput = ({ onMessageSent }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isGenerating) return;
    
    const userMessage = message.trim();
    console.log('Sending message:', userMessage);
    setMessage('');
    setIsGenerating(true);
    
    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.status === 'success') {
        onMessageSent(userMessage, data.output);
      } else {
        onMessageSent(userMessage, 'Error: Failed to get response from API');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      onMessageSent(userMessage, 'Error: Could not connect to chat API');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    setIsGenerating(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            className="min-h-[60px] max-h-[200px] pr-16 pl-12 resize-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-orange-500"
            disabled={isGenerating}
          />
          
          {/* Left side button */}
          <div className="absolute left-3 bottom-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isGenerating}
            >
              <Plus className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
          
          {/* Right side buttons */}
          <div className="absolute right-3 bottom-3 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isGenerating}
            >
              <Mic className="h-4 w-4 text-gray-500" />
            </Button>
            
            {isGenerating ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleStop}
              >
                <Square className="h-4 w-4 text-gray-500" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${
                  message.trim() 
                    ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleSend}
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>AI is generating a response...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
