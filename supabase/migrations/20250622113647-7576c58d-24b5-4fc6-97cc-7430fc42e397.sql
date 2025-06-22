
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create user_credentials table for username/password authentication
CREATE TABLE public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on user_credentials
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for user_credentials
CREATE POLICY "Admins can view all users"
  ON public.user_credentials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_credentials 
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username' 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON public.user_credentials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_credentials 
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username' 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON public.user_credentials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_credentials 
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username' 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON public.user_credentials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_credentials 
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username' 
      AND role = 'admin'
    )
  );

-- Insert default admin user (password: JeffFromIT!)
-- Using crypt function to hash the password
INSERT INTO public.user_credentials (username, password_hash, role)
VALUES ('admin', crypt('JeffFromIT!', gen_salt('bf')), 'admin');

-- Create function to authenticate username/password
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username TEXT, p_password TEXT)
RETURNS TABLE(user_id UUID, username TEXT, role user_role, is_active BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT uc.id, uc.username, uc.role, uc.is_active
  FROM public.user_credentials uc
  WHERE uc.username = p_username 
    AND uc.password_hash = crypt(p_password, uc.password_hash)
    AND uc.is_active = true;
END;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_credentials
    WHERE username = p_username AND role = 'admin' AND is_active = true
  );
END;
$$;
