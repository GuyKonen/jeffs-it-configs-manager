
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

class SupabaseDatabase {
  async init() {
    // Check if tables exist and seed if needed
    await this.seedData();
  }

  private async seedData() {
    // Check if admin user exists
    const { data: existingAdmin } = await supabase
      .from('user_credentials')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (!existingAdmin) {
      // Create admin user
      await supabase
        .from('user_credentials')
        .insert({
          username: 'admin',
          password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMye',  // bcrypt hash for '123'
          role: 'admin',
          is_active: true
        });

      // Create regular user
      await supabase
        .from('user_credentials')
        .insert({
          username: 'user',
          password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMye',  // bcrypt hash for 'user'
          role: 'user',
          is_active: true
        });
    }
  }

  // User methods
  async getUserByCredentials(username: string, password: string): Promise<User | null> {
    const { data } = await supabase.rpc('authenticate_user', {
      p_username: username,
      p_password: password
    });

    if (data && data.length > 0) {
      const user = data[0];
      return {
        id: user.user_id,
        username: user.username,
        password: '', // Don't return password
        role: user.role,
        created_at: new Date().toISOString(),
        is_active: user.is_active
      };
    }

    return null;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      username: user.username,
      password: '', // Don't return password
      role: user.role,
      created_at: user.created_at,
      is_active: user.is_active
    }));
  }

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('user_credentials')
      .insert({
        username: user.username,
        password_hash: user.password, // In production, this should be hashed
        role: user.role,
        is_active: user.is_active
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return {
      id: data.id,
      username: data.username,
      password: '',
      role: data.role,
      created_at: data.created_at,
      is_active: data.is_active
    };
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<void> {
    const updateData: any = {};
    
    if (updates.username) updateData.username = updates.username;
    if (updates.password) updateData.password_hash = updates.password; // In production, hash this
    if (updates.role) updateData.role = updates.role;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { error } = await supabase
      .from('user_credentials')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_credentials')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Chat session methods
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching chat sessions:', error);
      return [];
    }

    return data || [];
  }

  async createChatSession(session: ChatSession): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .insert(session);

    if (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }
  }

  async updateChatSession(id: string, updates: Partial<Omit<ChatSession, 'id' | 'user_id'>>): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update chat session: ${error.message}`);
    }
  }

  // Message methods
  async getMessages(sessionId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  }

  async createMessage(message: Message): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .insert(message);

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  async close() {
    // No cleanup needed for Supabase client
  }
}

export const database = new SupabaseDatabase();
