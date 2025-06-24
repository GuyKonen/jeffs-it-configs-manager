
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup - creates actual SQLite file
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Initialize database tables and seed data
function initializeDatabase() {
  // Create tables
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Chat sessions table
    db.run(`CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('user', 'assistant')),
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
    )`);

    // Seed admin user if not exists
    db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync('123', 10);
        db.run("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
          ['admin', hashedPassword, 'admin']);
        
        const userPassword = bcrypt.hashSync('user', 10);
        db.run("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
          ['user', userPassword, 'user']);
        
        console.log('Seeded admin user (password: 123) and regular user (password: user)');
      }
    });
  });
}

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  db.get("SELECT * FROM users WHERE username = ? AND is_active = 1", [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  });
});

// User management endpoints
app.get('/api/users', (req, res) => {
  db.all("SELECT id, username, role, is_active, created_at FROM users ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, is_active } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run("INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, ?)", 
    [username, hashedPassword, role, is_active ? 1 : 0], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
    res.json({ id: this.lastID });
  });
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role, is_active } = req.body;
  
  let query = "UPDATE users SET role = ?, is_active = ?";
  let params = [role, is_active ? 1 : 0];
  
  if (username) {
    query += ", username = ?";
    params.push(username);
  }
  
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += ", password_hash = ?";
    params.push(hashedPassword);
  }
  
  query += " WHERE id = ?";
  params.push(id);
  
  db.run(query, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user' });
    }
    res.json({ success: true });
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    res.json({ success: true });
  });
});

// Chat sessions endpoints
app.get('/api/chat-sessions/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all("SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/chat-sessions', (req, res) => {
  const { id, user_id, title, timestamp } = req.body;
  
  db.run("INSERT INTO chat_sessions (id, user_id, title, timestamp) VALUES (?, ?, ?, ?)", 
    [id, user_id, title, timestamp], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create chat session' });
    }
    res.json({ success: true });
  });
});

app.put('/api/chat-sessions/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  
  db.run("UPDATE chat_sessions SET title = ? WHERE id = ?", [title, id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update chat session' });
    }
    res.json({ success: true });
  });
});

// Messages endpoints
app.get('/api/messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  db.all("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC", [sessionId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/messages', (req, res) => {
  const { id, session_id, type, content, timestamp } = req.body;
  
  db.run("INSERT INTO messages (id, session_id, type, content, timestamp) VALUES (?, ?, ?, ?, ?)", 
    [id, session_id, type, content, timestamp], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create message' });
    }
    res.json({ success: true });
  });
});

// AI Chat endpoint (placeholder)
app.post('/api/chat', (req, res) => {
  const { message, conversation_id } = req.body;
  
  // This is a placeholder - you can integrate with your AI service here
  setTimeout(() => {
    res.json({
      response: `This is a mock AI response to: "${message}". Replace this endpoint with your actual AI integration.`
    });
  }, 1000);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`SQLite database file: ${dbPath}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
