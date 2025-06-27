import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

let dbPromise: Promise<any> | null = null;

const initializeDatabase = async () => {
  if (!dbPromise) {
    dbPromise = open({
      filename: './database.db',
      driver: sqlite3.Database,
    });
  }
  return dbPromise;
};

export const database = {
  db: null as any,

  async init() {
    try {
      this.db = await initializeDatabase();
      
      // Enable foreign key support
      await this.db.exec('PRAGMA foreign_keys = ON;');

      // Create users table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          password TEXT,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create chat_sessions table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          title TEXT,
          timestamp DATETIME,
          starred INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create messages table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          type TEXT,
          content TEXT,
          timestamp DATETIME,
          FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        )
      `);

      console.log('Database initialized');
    } catch (err) {
      console.error('Error initializing database', err);
    }
  },

  async createUser(user: { id: string; email: string; password?: string; role?: string }) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (id, email, password, role)
        VALUES (?, ?, ?, ?)
      `;
      this.db.run(sql, [user.id, user.email, user.password, user.role], function(err) {
        if (err) {
          console.error('Error creating user:', err);
          reject(err);
        } else {
          console.log('User created with id:', user.id);
          resolve(this.lastID);
        }
      });
    });
  },

  async findUserByEmail(email: string) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM users WHERE email = ?
      `;
      this.db.get(sql, [email], (err, row) => {
        if (err) {
          console.error('Error finding user by email:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  async findUserById(id: string) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM users WHERE id = ?
      `;
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error finding user by id:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  async updateUser(id: string, updates: { email?: string; password?: string; role?: string }) {
    return new Promise((resolve, reject) => {
      const { email, password, role } = updates;
      let sql = `UPDATE users SET updated_at = CURRENT_TIMESTAMP`;
      const params: any[] = [];

      if (email) {
        sql += `, email = ?`;
        params.push(email);
      }
      if (password) {
        sql += `, password = ?`;
        params.push(password);
      }
      if (role) {
        sql += `, role = ?`;
        params.push(role);
      }

      sql += ` WHERE id = ?`;
      params.push(id);

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error updating user:', err);
          reject(err);
        } else {
          console.log('User updated with id:', id);
          resolve(this.changes);
        }
      });
    });
  },

  async deleteUser(id: string) {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM users WHERE id = ?
      `;
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error deleting user:', err);
          reject(err);
        } else {
          console.log('User deleted with id:', id);
          resolve(this.changes);
        }
      });
    });
  },

  async createChatSession(session: {
    id: string;
    user_id: string;
    title: string;
    timestamp: string;
  }) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO chat_sessions (id, user_id, title, timestamp)
        VALUES (?, ?, ?, ?)
      `;
      this.db.run(sql, [session.id, session.user_id, session.title, session.timestamp], function(err) {
        if (err) {
          console.error('Error creating chat session:', err);
          reject(err);
        } else {
          console.log('Chat session created with id:', session.id);
          resolve(this.lastID);
        }
      });
    });
  },

  async getChatSessions(userId: string) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM chat_sessions WHERE user_id = ?
      `;
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          console.error('Error getting chat sessions:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
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
      const sql = `
        INSERT INTO messages (id, session_id, type, content, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `;
      this.db.run(sql, [message.id, message.session_id, message.type, message.content, message.timestamp], function(err) {
        if (err) {
          console.error('Error creating message:', err);
          reject(err);
        } else {
          console.log('Message created with id:', message.id);
          resolve(this.lastID);
        }
      });
    });
  },

  async getMessages(sessionId: string) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM messages WHERE session_id = ?
      `;
      this.db.all(sql, [sessionId], (err, rows) => {
        if (err) {
          console.error('Error getting messages:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  async starChatSession(sessionId: string) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE chat_sessions 
        SET starred = CASE WHEN starred = 1 THEN 0 ELSE 1 END 
        WHERE id = ?
      `;
      
      this.db.run(sql, [sessionId], function(err) {
        if (err) {
          console.error('Error toggling star status:', err);
          reject(err);
        } else {
          console.log('Star status toggled for session:', sessionId);
          resolve(this.changes);
        }
      });
    });
  },

  async deleteChatSession(sessionId: string) {
    return new Promise((resolve, reject) => {
      // First delete all messages in the session
      const deleteMessages = `DELETE FROM messages WHERE session_id = ?`;
      
      this.db.run(deleteMessages, [sessionId], (err) => {
        if (err) {
          console.error('Error deleting messages:', err);
          reject(err);
          return;
        }
        
        // Then delete the session
        const deleteSession = `DELETE FROM chat_sessions WHERE id = ?`;
        this.db.run(deleteSession, [sessionId], function(err) {
          if (err) {
            console.error('Error deleting chat session:', err);
            reject(err);
          } else {
            console.log('Chat session deleted:', sessionId);
            resolve(this.changes);
          }
        });
      });
    });
  }
};
