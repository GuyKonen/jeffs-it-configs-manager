
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';

const ChatWindow = () => {
  return (
    <div className="h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">OI</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Azure</h1>
        </div>
      </div>

      {/* Chat Content */}
      <ScrollArea className="flex-1 h-full">
        <div className="max-w-4xl mx-auto p-6">
          {/* Welcome Message */}
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">OI</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Azure</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">How can I help you today?</p>
            
            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Button variant="outline" size="sm" className="gap-2">
                <Copy className="h-4 w-4" />
                Code Interpreter
              </Button>
            </div>
            
            {/* Suggested Prompts */}
            <div className="space-y-3 max-w-md mx-auto">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-left mb-2">✨ Suggested</div>
              
              <div className="text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <div className="font-medium text-gray-900 dark:text-white text-sm">Help me study</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">vocabulary for a college entrance exam</div>
              </div>
              
              <div className="text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <div className="font-medium text-gray-900 dark:text-white text-sm">Give me ideas</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">for what to do with my kids' art</div>
              </div>
              
              <div className="text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <div className="font-medium text-gray-900 dark:text-white text-sm">Explain options trading</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">if I'm familiar with buying and selling stocks</div>
              </div>
            </div>
          </div>
          
          {/* Activation Notice */}
          <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Activate Windows</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Go to Settings to activate Windows</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatWindow;
