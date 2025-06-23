
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, RotateCcw, Square, ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ChatWindow = () => {
  const [messages] = useState([
    {
      id: 1,
      type: 'user',
      content: 'Can you help me create a React component for a todo list?',
      timestamp: '10:30 AM'
    },
    {
      id: 2,
      type: 'assistant',
      content: `I'd be happy to help you create a React todo list component! Here's a complete example:

\`\`\`jsx
import React, { useState } from 'react';

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: inputValue, 
        completed: false 
      }]);
      setInputValue('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          className="flex-1 p-2 border rounded-l"
          placeholder="Add a new todo..."
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      
      <ul className="space-y-2">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center gap-2 p-2 border rounded">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
\`\`\`

This component includes:

• **State management** with \`useState\` for todos and input
• **Add functionality** to create new todos
• **Toggle functionality** to mark todos as complete/incomplete  
• **Delete functionality** to remove todos
• **Responsive design** with Tailwind CSS classes
• **Keyboard support** (Enter to add todos)

The component is fully functional and ready to use. You can customize the styling, add more features like editing todos, or integrate it with a backend API for persistence.

Would you like me to explain any part of the code or add additional features?`,
      timestamp: '10:31 AM'
    }
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              How can I help you today?
            </h2>
            <p className="text-gray-500">
              Ask me anything about coding, design, or general knowledge.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div className={`flex-1 max-w-3xl ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div
                  className={`inline-block p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {message.content.split('\n').map((line, index) => {
                      if (line.startsWith('```')) {
                        return null; // Handle code blocks separately
                      }
                      return (
                        <div key={index} className="mb-2 last:mb-0">
                          {line.includes('`') ? (
                            <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                              {line.replace(/`/g, '')}
                            </code>
                          ) : (
                            line
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-gray-500 ml-auto">
                      {message.timestamp}
                    </span>
                  </div>
                )}
                
                {message.type === 'user' && (
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-gray-500">
                      {message.timestamp}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatWindow;
