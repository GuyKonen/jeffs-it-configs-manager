const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🌐 [${timestamp}] ${req.method} ${req.url}`);
  console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 Origin:', req.get('Origin') || 'No Origin header');
  console.log('🔍 Host:', req.get('Host') || 'No Host header');
  console.log('🔍 User-Agent:', req.get('User-Agent') || 'No User-Agent');
  next();
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Add middleware to log request body
app.use((req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '[HIDDEN]';
    console.log('📝 Request Body:', JSON.stringify(logBody, null, 2));
  }
  next();
});

// Database setup - creates actual SQLite file
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('🔍 DEBUG: Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ ERROR: Error opening database:', err);
  } else {
    console.log('✅ SUCCESS: Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// .env file path - updated to /app/.env
const envPath = path.join('/app', '.env');

// Initialize database tables and seed data
function initializeDatabase() {
  // Create tables
  db.serialize(() => {
    console.log('🔍 DEBUG: Initializing database schema...');
    
    // Create the users table with all required columns
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active BOOLEAN DEFAULT 1,
      totp_secret TEXT,
      totp_enabled BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('❌ ERROR: Error creating users table:', err);
      } else {
        console.log('✅ SUCCESS: Users table created/verified');
        seedDefaultUsers();
      }
    });

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
  });
}

function seedDefaultUsers() {
  console.log('🔍 DEBUG: Checking for default users...');
  // Seed admin user if not exists
  db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
    if (err) {
      console.error('❌ ERROR: Error checking for admin user:', err);
      return;
    }
    
    if (!row) {
      console.log('🔍 DEBUG: Creating default users...');
      const hashedPassword = bcrypt.hashSync('123', 10);
      db.run("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
        ['admin', hashedPassword, 'admin'], (err) => {
        if (err) {
          console.error('❌ ERROR: Error creating admin user:', err);
        } else {
          console.log('✅ SUCCESS: Created admin user (username: admin, password: 123)');
        }
      });
      
      const userPassword = bcrypt.hashSync('user', 10);
      db.run("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
        ['user', userPassword, 'user'], (err) => {
        if (err) {
          console.error('❌ ERROR: Error creating regular user:', err);
        } else {
          console.log('✅ SUCCESS: Created regular user (username: user, password: user)');
        }
      });
    } else {
      console.log('✅ INFO: Default users already exist');
    }
  });
}

// Helper functions for .env file management
function readEnvFile() {
  try {
    if (!fs.existsSync(envPath)) {
      console.log('.env file does not exist at /app/.env, creating default');
      const defaultEnv = `# --- Azure MCP ---
AZURE_MCP_SERVER_URL=http://azure-mcp:7002/sse
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=


# --- Slack ---
SLACK_ACCESS_TOKEN=

# --- Okta ---
OKTA_MCP_SERVER_URL=http://okta-mcp:7003/sse
OKTA_CLIENT_ORGURL=
OKTA_API_TOKEN=

# --- Azure OpenAI --- 
OPENAI_RESOURCE_NAME=
OPENAI_API_KEY=
OPENAI_API_VERSION=
OPENAI_DEPLOYMENT_NAME=
OPENAI_DEPLOYMENT_NAME_2=
OPENAI_MODEL=


AZURE_TENANT_ID=


# --- Intune ----
INTUNE_MCP_SERVER_URL=http://intune-mcp:7004/sse
INTUNE_CLIENT_ID=
INTUNE_CLIENT_SECRET=
INTUNE_TENANT_ID=
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
AZURE_MCP_SERVER_URL=http://azure-mcp:7002/sse
AZURE_CLIENT_ID=${configs.AZURE_CLIENT_ID || ''}
AZURE_CLIENT_SECRET=${configs.AZURE_CLIENT_SECRET || ''}


# --- Slack ---
SLACK_ACCESS_TOKEN=${configs.SLACK_ACCESS_TOKEN || ''}

# --- Okta ---
OKTA_MCP_SERVER_URL=http://okta-mcp:7003/sse
OKTA_CLIENT_ORGURL=${configs.OKTA_CLIENT_ORGURL || ''}
OKTA_API_TOKEN=${configs.OKTA_API_TOKEN || ''}

# --- Azure OpenAI --- 
OPENAI_RESOURCE_NAME=${configs.OPENAI_RESOURCE_NAME || ''}
OPENAI_API_KEY=${configs.OPENAI_API_KEY || ''}
OPENAI_API_VERSION=${configs.OPENAI_API_VERSION || ''}
OPENAI_DEPLOYMENT_NAME=${configs.OPENAI_DEPLOYMENT_NAME || ''}
OPENAI_DEPLOYMENT_NAME_2=${configs.OPENAI_DEPLOYMENT_NAME_2 || ''}
OPENAI_MODEL=${configs.OPENAI_MODEL || ''}


AZURE_TENANT_ID=${configs.AZURE_TENANT_ID || ''}


# --- Intune ----
INTUNE_MCP_SERVER_URL=http://intune-mcp:7004/sse
INTUNE_CLIENT_ID=${configs.INTUNE_CLIENT_ID || ''}
INTUNE_CLIENT_SECRET=${configs.INTUNE_CLIENT_SECRET || ''}
INTUNE_TENANT_ID=${configs.INTUNE_TENANT_ID || ''}
`;
}

// Environment configuration endpoints
app.get('/api/env-config', (req, res) => {
  try {
    const envContent = readEnvFile();
    const configs = parseEnvContent(envContent);
    console.log('Retrieved env configs from /app/.env:', Object.keys(configs));
    res.json(configs);
  } catch (error) {
    console.error('Error reading env config:', error);
    res.status(500).json({ error: 'Failed to read environment configuration' });
  }
});

app.post('/api/env-config', (req, res) => {
  try {
    const { configs } = req.body;
    console.log('Updating env configs at /app/.env:', Object.keys(configs));
    
    const envContent = generateEnvContent(configs);
    fs.writeFileSync(envPath, envContent);
    
    console.log('Successfully updated /app/.env file');
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
  
  console.log('\n🔐 LOGIN ATTEMPT');
  console.log('🔍 Username:', username);
  console.log('🔍 Has password:', !!password);
  console.log('🔍 Has TOTP token:', !!totp_token);
  console.log('🔍 Request IP:', req.ip);
  console.log('🔍 Request timestamp:', new Date().toISOString());
  
  if (!username || !password) {
    console.log('❌ ERROR: Missing username or password');
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  console.log('🔍 DEBUG: Querying database for user...');
  db.get("SELECT * FROM users WHERE username = ? AND is_active = 1", [username], async (err, user) => {
    if (err) {
      console.error('❌ ERROR: Database error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      console.log('❌ ERROR: User not found or inactive:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✅ SUCCESS: User found in database');
    console.log('🔍 User details:', {
      id: user.id,
      username: user.username,
      role: user.role,
      totp_enabled: user.totp_enabled,
      is_active: user.is_active
    });
    
    console.log('🔍 DEBUG: Comparing passwords...');
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      console.log('❌ ERROR: Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✅ SUCCESS: Password matches');
    
    // Check TOTP if enabled
    if (user.totp_enabled && user.totp_secret) {
      console.log('🔍 DEBUG: TOTP is enabled for user');
      if (!totp_token) {
        console.log('❌ ERROR: TOTP token required but not provided');
        return res.status(401).json({ error: 'TOTP token required', requires_totp: true });
      }
      
      try {
        const { authenticator } = require('otplib');
        if (!authenticator.verify({ token: totp_token, secret: user.totp_secret })) {
          console.log('❌ ERROR: Invalid TOTP token');
          return res.status(401).json({ error: 'Invalid TOTP token' });
        }
        console.log('✅ SUCCESS: TOTP token verified');
      } catch (error) {
        console.error('❌ ERROR: TOTP verification error:', error);
        return res.status(500).json({ error: 'TOTP verification failed' });
      }
    }
    
    const responseData = {
      id: user.id,
      username: user.username,
      role: user.role,
      totp_enabled: user.totp_enabled || false
    };
    
    console.log('✅ SUCCESS: Login successful for user:', username);
    console.log('🔍 Response data:', responseData);
    res.json(responseData);
  });
});

// TOTP setup endpoints
app.post('/api/totp/setup', (req, res) => {
  const { user_id } = req.body;
  console.log('SERVER: Setting up TOTP for user ID:', user_id);
  
  try {
    const { authenticator } = require('otplib');
    const secret = authenticator.generateSecret();
    
    db.run("UPDATE users SET totp_secret = ? WHERE id = ?", [secret, user_id], (err) => {
      if (err) {
        console.error('SERVER: Error setting up TOTP:', err);
        return res.status(500).json({ error: 'Failed to setup TOTP' });
      }
      
      const qrCodeUrl = authenticator.keyuri('JeffFromIT', 'JeffFromIT', secret);
      console.log('SERVER: TOTP setup successful for user ID:', user_id);
      res.json({ secret, qr_code_url: qrCodeUrl });
    });
  } catch (error) {
    console.error('SERVER: Error in TOTP setup - otplib not installed?:', error);
    return res.status(500).json({ error: 'TOTP library not available. Please install otplib.' });
  }
});

app.post('/api/totp/enable', (req, res) => {
  const { user_id, token } = req.body;
  console.log('SERVER: Enabling TOTP for user ID:', user_id);
  
  db.get("SELECT totp_secret FROM users WHERE id = ?", [user_id], (err, user) => {
    if (err || !user) {
      console.error('SERVER: User not found for TOTP enable:', user_id, err);
      return res.status(500).json({ error: 'User not found' });
    }
    
    try {
      const { authenticator } = require('otplib');
      if (!authenticator.verify({ token, secret: user.totp_secret })) {
        console.log('SERVER: Invalid TOTP token during enable for user ID:', user_id);
        return res.status(401).json({ error: 'Invalid TOTP token' });
      }
      
      db.run("UPDATE users SET totp_enabled = 1 WHERE id = ?", [user_id], (err) => {
        if (err) {
          console.error('SERVER: Error enabling TOTP:', err);
          return res.status(500).json({ error: 'Failed to enable TOTP' });
        }
        console.log('SERVER: TOTP enabled successfully for user ID:', user_id);
        res.json({ success: true });
      });
    } catch (error) {
      console.error('SERVER: Error in TOTP enable - otplib not installed?:', error);
      return res.status(500).json({ error: 'TOTP library not available. Please install otplib.' });
    }
  });
});

app.post('/api/totp/disable', (req, res) => {
  const { user_id } = req.body;
  console.log('SERVER: Disabling TOTP for user ID:', user_id);
  
  db.run("UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?", [user_id], (err) => {
    if (err) {
      console.error('SERVER: Error disabling TOTP:', err);
      return res.status(500).json({ error: 'Failed to disable TOTP' });
    }
    console.log('SERVER: TOTP disabled successfully for user ID:', user_id);
    res.json({ success: true });
  });
});

// User management endpoints
app.get('/api/users', (req, res) => {
  console.log('SERVER: Fetching all users');
  db.all("SELECT id, username, role, is_active, totp_enabled, created_at FROM users ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error('SERVER: Database error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('SERVER: Found users:', rows.length);
    res.json(rows);
  });
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, is_active } = req.body;
  console.log('SERVER: Creating user:', { username, role, is_active });
  
  if (!username || !password) {
    console.log('SERVER: Missing required fields for user creation');
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run("INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, ?)", 
      [username, hashedPassword, role || 'user', is_active ? 1 : 0], function(err) {
      if (err) {
        console.error('SERVER: Error creating user:', err);
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Failed to create user' });
      }
      console.log('SERVER: User created successfully with ID:', this.lastID);
      res.json({ id: this.lastID });
    });
  } catch (error) {
    console.error('SERVER: Error in user creation:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role, is_active } = req.body;
  console.log('SERVER: Updating user ID:', id, { username, role, is_active });
  
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
      console.error('SERVER: Error updating user:', err);
      return res.status(500).json({ error: 'Failed to update user' });
    }
    console.log('SERVER: User updated successfully:', id);
    res.json({ success: true });
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  console.log('SERVER: Deleting user ID:', id);
  
  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      console.error('SERVER: Error deleting user:', err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    console.log('SERVER: User deleted successfully:', id);
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

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  console.log('💓 Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'JeffFromIT Backend',
    port: PORT 
  });
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint requested');
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

console.log(`\n🚀 Starting server...`);
console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔍 Port: ${PORT}`);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ SUCCESS: Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔍 Database file: ${dbPath}`);
  console.log(`🔍 Server ready to accept connections\n`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('❌ ERROR:', err.message);
    } else {
      console.log('✅ SUCCESS: Database connection closed');
    }
    console.log('👋 Server shutdown complete');
    process.exit(0);
  });
});
