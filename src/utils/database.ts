
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  created_at: string;
  is_active: boolean;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  timestamp: string;
}

export interface Message {
  id: string;
  session_id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface LocalDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string };
  };
  chat_sessions: {
    key: string;
    value: ChatSession;
    indexes: { 'by-user': string };
  };
  messages: {
    key: string;
    value: Message;
    indexes: { 'by-session': string };
  };
}

class LocalDatabase {
  private db: IDBPDatabase<LocalDB> | null = null;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<LocalDB>('local-app-db', 1, {
      upgrade(db) {
        // Users store
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-username', 'username', { unique: true });

        // Chat sessions store
        const sessionStore = db.createObjectStore('chat_sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-user', 'user_id');

        // Messages store
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('by-session', 'session_id');
      },
    });

    await this.seedData();
    return this.db;
  }

  private async seedData() {
    const db = await this.init();
    const tx = db.transaction(['users'], 'readwrite');
    
    // Check if users already exist
    const existingUsers = await tx.store.count();
    
    if (existingUsers === 0) {
      // Add default users
      await tx.store.add({
        id: 'user1',
        username: 'admin',
        password: '123',
        role: 'admin',
        created_at: new Date().toISOString(),
        is_active: true
      });
      
      await tx.store.add({
        id: 'user2',
        username: 'user',
        password: 'user',
        role: 'user',
        created_at: new Date().toISOString(),
        is_active: true
      });
    }
    
    await tx.done;
  }

  // User methods
  async getUserByCredentials(username: string, password: string): Promise<User | null> {
    const db = await this.init();
    const tx = db.transaction(['users'], 'readonly');
    const users = await tx.store.getAll();
    
    const user = users.find(u => u.username === username && u.password === password);
    return user || null;
  }

  async getAllUsers(): Promise<User[]> {
    const db = await this.init();
    const tx = db.transaction(['users'], 'readonly');
    const users = await tx.store.getAll();
    return users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const db = await this.init();
    const id = `user_${Date.now()}`;
    const created_at = new Date().toISOString();
    const newUser = { id, ...user, created_at };
    
    const tx = db.transaction(['users'], 'readwrite');
    await tx.store.add(newUser);
    await tx.done;
    
    return newUser;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(['users'], 'readwrite');
    const user = await tx.store.get(id);
    
    if (user) {
      const updatedUser = { ...user, ...updates };
      await tx.store.put(updatedUser);
    }
    
    await tx.done;
  }

  async deleteUser(id: string): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(['users'], 'readwrite');
    await tx.store.delete(id);
    await tx.done;
  }

  // Chat session methods
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    const db = await this.init();
    const tx = db.transaction(['chat_sessions'], 'readonly');
    const sessions = await tx.store.index('by-user').getAll(userId);
    return sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createChatSession(session: ChatSession): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(['chat_sessions'], 'readwrite');
    await tx.store.add(session);
    await tx.done;
  }

  async updateChatSession(id: string, updates: Partial<Omit<ChatSession, 'id' | 'user_id'>>): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(['chat_sessions'], 'readwrite');
    const session = await tx.store.get(id);
    
    if (session) {
      const updatedSession = { ...session, ...updates };
      await tx.store.put(updatedSession);
    }
    
    await tx.done;
  }

  // Message methods
  async getMessages(sessionId: string): Promise<Message[]> {
    const db = await this.init();
    const tx = db.transaction(['messages'], 'readonly');
    const messages = await tx.store.index('by-session').getAll(sessionId);
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createMessage(message: Message): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(['messages'], 'readwrite');
    await tx.store.add(message);
    await tx.done;
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const database = new LocalDatabase();
