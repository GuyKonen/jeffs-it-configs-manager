
-- Create a table for Entra ID users authenticated via Device Code Flow
CREATE TABLE public.entra_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microsoft_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  tenant_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Add indexes for performance
CREATE INDEX idx_entra_users_microsoft_id ON public.entra_users(microsoft_user_id);
CREATE INDEX idx_entra_users_email ON public.entra_users(email);

-- Enable RLS
ALTER TABLE public.entra_users ENABLE ROW LEVEL SECURITY;

-- Create policies for entra_users table
CREATE POLICY "Users can view their own profile" 
  ON public.entra_users 
  FOR SELECT 
  USING (microsoft_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Service role can manage all users" 
  ON public.entra_users 
  FOR ALL 
  USING (current_setting('role') = 'service_role');
