const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

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

// .env file path
const envPath = path.join(__dirname, '..', '.env');

// Initialize database tables and seed data
function initializeDatabase() {
  // Create tables
  db.serialize(() => {
    // Users table with TOTP support
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active BOOLEAN DEFAULT 1,
      totp_secret TEXT,
      totp_enabled BOOLEAN DEFAULT 0,
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

// Helper functions for .env file management
function readEnvFile() {
  try {
    if (!fs.existsSync(envPath)) {
      console.log('.env file does not exist, creating default');
      const defaultEnv = `# --- Azure MCP ---
AZURE_MCP_SERVER_URL=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=

# --- Slack ---
SLACK_ACCESS_TOKEN=

# --- Okta ---
OKTA_CLIENT_ORGURL=
OKTA_API_TOKEN=

# --- Azure OpenAI ---
OPENAI_RESOURCE_NAME=
OPENAI_API_KEY=
OPENAI_API_VERSION=
OPENAI_DEPLOYMENT_NAME=
OPENAI_MODEL=

AZURE_TENANT_ID=
`;
      fs.writeFileSync(envPath, defaultEnv);
      return defaultEnv;
    }
    
    return fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.error('Error reading .env file:', error);
    return '';
  }
}

function parseEnvContent(content) {
  const configs = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        configs[key.trim()] = valueParts.join('=') || '';
      }
    }
  }
  
  return configs;
}

function generateEnvContent(configs) {
  return `# --- Azure MCP ---
AZURE_MCP_SERVER_URL=${configs.AZURE_MCP_SERVER_URL || ''}
AZURE_CLIENT_ID=${configs.AZURE_CLIENT_ID || ''}
AZURE_CLIENT_SECRET=${configs.AZURE_CLIENT_SECRET || ''}

# --- Slack ---
SLACK_ACCESS_TOKEN=${configs.SLACK_ACCESS_TOKEN || ''}

# --- Okta ---
OKTA_CLIENT_ORGURL=${configs.OKTA_CLIENT_ORGURL || ''}
OKTA_API_TOKEN=${configs.OKTA_API_TOKEN || ''}

# --- Azure OpenAI ---
OPENAI_RESOURCE_NAME=${configs.OPENAI_RESOURCE_NAME || ''}
OPENAI_API_KEY=${configs.OPENAI_API_KEY || ''}
OPENAI_API_VERSION=${configs.OPENAI_API_VERSION || ''}
OPENAI_DEPLOYMENT_NAME=${configs.OPENAI_DEPLOYMENT_NAME || ''}
OPENAI_MODEL=${configs.OPENAI_MODEL || ''}

AZURE_TENANT_ID=${configs.AZURE_TENANT_ID || ''}
`;
}

// Environment configuration endpoints
app.get('/api/env-config', (req, res) => {
  try {
    const envContent = readEnvFile();
    const configs = parseEnvContent(envContent);
    console.log('Retrieved env configs:', Object.keys(configs));
    res.json(configs);
  } catch (error) {
    console.error('Error reading env config:', error);
    res.status(500).json({ error: 'Failed to read environment configuration' });
  }
});

app.post('/api/env-config', (req, res) => {
  try {
    const { configs } = req.body;
    console.log('Updating env configs:', Object.keys(configs));
    
    const envContent = generateEnvContent(configs);
    fs.writeFileSync(envPath, envContent);
    
    console.log('Successfully updated .env file');
    res.json({ 
      success: true, 
      message: 'Environment configuration updated successfully' 
    });
  } catch (error) {
    console.error('Error updating env config:', error);
    res.status(500).json({ error: 'Failed to update environment configuration' });
  }
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  const { username, password, totp_token } = req.body;
  
  db.get("SELECT * FROM users WHERE username = ? AND is_active = 1", [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check TOTP if enabled
    if (user.totp_enabled && user.totp_secret) {
      if (!totp_token) {
        return res.status(401).json({ error: 'TOTP token required', requires_totp: true });
      }
      
      const { authenticator } = require('otplib');
      if (!authenticator.verify({ token: totp_token, secret: user.totp_secret })) {
        return res.status(401).json({ error: 'Invalid TOTP token' });
      }
    }
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      totp_enabled: user.totp_enabled
    });
  });
});

// TOTP setup endpoints
app.post('/api/totp/setup', (req, res) => {
  const { user_id } = req.body;
  const { authenticator } = require('otplib');
  const secret = authenticator.generateSecret();
  
  db.run("UPDATE users SET totp_secret = ? WHERE id = ?", [secret, user_id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to setup TOTP' });
    }
    
    const qrCodeUrl = authenticator.keyuri('JeffFromIT', 'JeffFromIT', secret);
    res.json({ secret, qr_code_url: qrCodeUrl });
  });
});

app.post('/api/totp/enable', (req, res) => {
  const { user_id, token } = req.body;
  
  db.get("SELECT totp_secret FROM users WHERE id = ?", [user_id], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ error: 'User not found' });
    }
    
    const { authenticator } = require('otplib');
    if (!authenticator.verify({ token, secret: user.totp_secret })) {
      return res.status(401).json({ error: 'Invalid TOTP token' });
    }
    
    db.run("UPDATE users SET totp_enabled = 1 WHERE id = ?", [user_id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to enable TOTP' });
      }
      res.json({ success: true });
    });
  });
});

app.post('/api/totp/disable', (req, res) => {
  const { user_id } = req.body;
  
  db.run("UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?", [user_id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to disable TOTP' });
    }
    res.json({ success: true });
  });
});

// User management endpoints
app.get('/api/users', (req, res) => {
  db.all("SELECT id, username, role, is_active, totp_enabled, created_at FROM users ORDER BY created_at DESC", (err, rows) => {
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
app.post('/api/chat', async (req, res) => {
  const { message, conversation_id } = req.body;
  
  try {
    // Forward to localhost:8000/chat
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error forwarding to chat service:', error);
    res.status(500).json({
      response: `Error connecting to chat service on localhost:8000. Please ensure the chat service is running.`
    });
  }
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
