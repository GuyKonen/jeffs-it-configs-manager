
import Database from 'better-sqlite3';

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

class LocalDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database('app.db');
    this.initTables();
    this.seedData();
  }

  private initTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Chat sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
      )
    `);
  }

  private seedData() {
    const checkUser = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (checkUser.count === 0) {
      const insertUser = this.db.prepare(`
        INSERT INTO users (id, username, password, role, created_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertUser.run('user1', 'admin', '123', 'admin', new Date().toISOString(), true);
      insertUser.run('user2', 'user', 'user', 'user', new Date().toISOString(), true);
    }
  }

  // User methods
  getUserByCredentials(username: string, password: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
    return stmt.get(username, password) as User | null;
  }

  getAllUsers(): User[] {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as User[];
  }

  createUser(user: Omit<User, 'id' | 'created_at'>): User {
    const id = `user_${Date.now()}`;
    const created_at = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, password, role, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, user.username, user.password, user.role, created_at, user.is_active);
    
    return { id, ...user, created_at };
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): void {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`UPDATE users SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
  }

  deleteUser(id: string): void {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }

  // Chat session methods
  getChatSessions(userId: string): ChatSession[] {
    const stmt = this.db.prepare('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY timestamp DESC');
    return stmt.all(userId) as ChatSession[];
  }

  createChatSession(session: ChatSession): void {
    const stmt = this.db.prepare(`
      INSERT INTO chat_sessions (id, user_id, title, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(session.id, session.user_id, session.title, session.timestamp);
  }

  updateChatSession(id: string, updates: Partial<Omit<ChatSession, 'id' | 'user_id'>>): void {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`UPDATE chat_sessions SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
  }

  // Message methods
  getMessages(sessionId: string): Message[] {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC');
    return stmt.all(sessionId) as Message[];
  }

  createMessage(message: Message): void {
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, session_id, type, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(message.id, message.session_id, message.type, message.content, message.timestamp);
  }

  close() {
    this.db.close();
  }
}

export const database = new LocalDatabase();
