
// In-memory database implementation for browser environment
interface User {
  id: string;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
  totp_enabled?: boolean;
  totp_secret?: string;
  created_at?: string;
  updated_at?: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  timestamp: string;
  starred?: number;
}

interface Message {
  id: string;
  session_id: string;
  type: string;
  content: string;
  timestamp: string;
}

// In-memory storage
let users: User[] = [];
let chatSessions: ChatSession[] = [];
let messages: Message[] = [];

export const database = {
  db: null as any,

  async init() {
    try {
      console.log('Database initialized (in-memory)');
      
      // Initialize with a default admin user if none exists
      if (users.length === 0) {
        await this.createUser({
          id: 'admin_1',
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
          is_active: true
        });
      }
    } catch (err) {
      console.error('Error initializing database', err);
    }
  },

  async createUser(user: { id?: string; username?: string; email?: string; password?: string; role?: string; is_active?: boolean }) {
    return new Promise((resolve, reject) => {
      try {
        const id = user.id || `user_${Date.now()}`;
        const newUser: User = {
          id,
          username: user.username,
          email: user.email,
          password: user.password,
          role: user.role || 'user',
          is_active: user.is_active !== false,
          totp_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        users.push(newUser);
        console.log('User created with id:', id);
        resolve({ id, ...user });
      } catch (err) {
        console.error('Error creating user:', err);
        reject(err);
      }
    });
  },

  async getAllUsers(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const userList = users.map(user => ({
          ...user,
          is_active: Boolean(user.is_active),
          totp_enabled: Boolean(user.totp_enabled)
        }));
        resolve(userList);
      } catch (err) {
        console.error('Error getting all users:', err);
        reject(err);
      }
    });
  },

  async getUserByCredentials(username: string, password: string, totpToken?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const user = users.find(u => u.username === username && u.password === password && u.is_active);
        
        if (!user) {
          resolve(null);
        } else {
          // If TOTP is enabled for user, check token
          if (user.totp_enabled && !totpToken) {
            reject(new Error('TOTP_REQUIRED'));
          } else {
            resolve({
              ...user,
              is_active: Boolean(user.is_active),
              totp_enabled: Boolean(user.totp_enabled)
            });
          }
        }
      } catch (err) {
        console.error('Error finding user by credentials:', err);
        reject(err);
      }
    });
  },

  async updateUser(id: string, updates: { username?: string; email?: string; password?: string; role?: string; is_active?: boolean }) {
    return new Promise((resolve, reject) => {
      try {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
          reject(new Error('User not found'));
          return;
        }

        const user = users[userIndex];
        users[userIndex] = {
          ...user,
          ...updates,
          updated_at: new Date().toISOString()
        };

        console.log('User updated with id:', id);
        resolve(1);
      } catch (err) {
        console.error('Error updating user:', err);
        reject(err);
      }
    });
  },

  async deleteUser(id: string) {
    return new Promise((resolve, reject) => {
      try {
        const initialLength = users.length;
        users = users.filter(u => u.id !== id);
        const changes = initialLength - users.length;
        
        console.log('User deleted with id:', id);
        resolve(changes);
      } catch (err) {
        console.error('Error deleting user:', err);
        reject(err);
      }
    });
  },

  async findUserByEmail(email: string) {
    return new Promise((resolve, reject) => {
      try {
        const user = users.find(u => u.email === email);
        resolve(user || null);
      } catch (err) {
        console.error('Error finding user by email:', err);
        reject(err);
      }
    });
  },

  async findUserById(id: string) {
    return new Promise((resolve, reject) => {
      try {
        const user = users.find(u => u.id === id);
        resolve(user || null);
      } catch (err) {
        console.error('Error finding user by id:', err);
        reject(err);
      }
    });
  },

  async createChatSession(session: {
    id: string;
    user_id: string;
    title: string;
    timestamp: string;
  }) {
    return new Promise((resolve, reject) => {
      try {
        const newSession: ChatSession = {
          ...session,
          starred: 0
        };
        chatSessions.push(newSession);
        console.log('Chat session created with id:', session.id);
        resolve(session.id);
      } catch (err) {
        console.error('Error creating chat session:', err);
        reject(err);
      }
    });
  },

  async getChatSessions(userId: string) {
    return new Promise((resolve, reject) => {
      try {
        const sessions = chatSessions.filter(s => s.user_id === userId);
        resolve(sessions);
      } catch (err) {
        console.error('Error getting chat sessions:', err);
        reject(err);
      }
    });
  },

  async createMessage(message: {
    id: string;
    session_id: string;
    type: string;
    content: string;
    timestamp: string;
  }) {
    return new Promise((resolve, reject) => {
      try {
        messages.push(message);
        console.log('Message created with id:', message.id);
        resolve(message.id);
      } catch (err) {
        console.error('Error creating message:', err);
        reject(err);
      }
    });
  },

  async getMessages(sessionId: string) {
    return new Promise((resolve, reject) => {
      try {
        const sessionMessages = messages.filter(m => m.session_id === sessionId);
        resolve(sessionMessages);
      } catch (err) {
        console.error('Error getting messages:', err);
        reject(err);
      }
    });
  },

  async starChatSession(sessionId: string) {
    return new Promise((resolve, reject) => {
      try {
        const sessionIndex = chatSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
          chatSessions[sessionIndex].starred = chatSessions[sessionIndex].starred ? 0 : 1;
          console.log('Star status toggled for session:', sessionId);
          resolve(1);
        } else {
          resolve(0);
        }
      } catch (err) {
        console.error('Error toggling star status:', err);
        reject(err);
      }
    });
  },

  async deleteChatSession(sessionId: string) {
    return new Promise((resolve, reject) => {
      try {
        // Delete messages first
        const initialMessageCount = messages.length;
        messages = messages.filter(m => m.session_id !== sessionId);
        
        // Delete session
        const initialSessionCount = chatSessions.length;
        chatSessions = chatSessions.filter(s => s.id !== sessionId);
        
        const changes = initialSessionCount - chatSessions.length;
        console.log('Chat session deleted:', sessionId);
        resolve(changes);
      } catch (err) {
        console.error('Error deleting chat session:', err);
        reject(err);
      }
    });
  }
};
