const API_BASE_URL = 'http://localhost:3001/api';

export interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  created_at: string;
  is_active: boolean;
  totp_enabled?: boolean;
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

class LocalApiDatabase {
  async init() {
    // No initialization needed - server handles database setup
    console.log('Database initialized - using local API server');
  }

  // User methods
  async getUserByCredentials(username: string, password: string, totpToken?: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, totp_token: totpToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.requires_totp) {
          throw new Error('TOTP_REQUIRED');
        }
        return null;
      }

      const user = await response.json();
      return {
        id: user.id.toString(),
        username: user.username,
        password: '', // Don't return password
        role: user.role,
        created_at: new Date().toISOString(),
        is_active: true,
        totp_enabled: user.totp_enabled
      };
    } catch (error) {
      console.error('Auth error:', error);
      if (error.message === 'TOTP_REQUIRED') {
        throw error;
      }
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      const users = await response.json();
      
      return users.map((user: any) => ({
        id: user.id.toString(),
        username: user.username,
        password: '',
        role: user.role,
        created_at: user.created_at,
        is_active: user.is_active,
        totp_enabled: user.totp_enabled
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username,
        password: user.password,
        role: user.role,
        is_active: user.is_active
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    const result = await response.json();
    return {
      id: result.id.toString(),
      username: user.username,
      password: '',
      role: user.role,
      created_at: new Date().toISOString(),
      is_active: user.is_active,
      totp_enabled: user.totp_enabled
    };
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  }

  // TOTP methods
  async setupTOTP(userId: string): Promise<{ secret: string; qr_code_url: string }> {
    const response = await fetch(`${API_BASE_URL}/totp/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to setup TOTP');
    }

    return await response.json();
  }

  async enableTOTP(userId: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/totp/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, token }),
    });

    if (!response.ok) {
      throw new Error('Failed to enable TOTP');
    }
  }

  async disableTOTP(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/totp/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to disable TOTP');
    }
  }

  // Chat session methods
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat-sessions/${userId}`);
      const sessions = await response.json();
      return sessions || [];
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      return [];
    }
  }

  async createChatSession(session: ChatSession): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat session');
    }
  }

  async updateChatSession(id: string, updates: Partial<Omit<ChatSession, 'id' | 'user_id'>>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat-sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update chat session');
    }
  }

  // Message methods
  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${sessionId}`);
      const messages = await response.json();
      return messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async createMessage(message: Message): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to create message');
    }
  }

  async close() {
    // No cleanup needed for HTTP client
  }
}

export const database = new LocalApiDatabase();
