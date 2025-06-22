
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, code, state } = await req.json();

    if (action === 'initiate') {
      // Generate OIDC authorization URL
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
      const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
      const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
      const redirectUri = Deno.env.get('MICROSOFT_REDIRECT_URI') || `${req.headers.get('origin')}/auth/callback`;

      if (!clientId || !tenantId) {
        return new Response(JSON.stringify({ 
          error: 'OIDC configuration missing. Please configure Microsoft credentials.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid profile email&` +
        `state=${crypto.randomUUID()}`;

      return new Response(JSON.stringify({ 
        authUrl,
        redirectUri 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      // Exchange code for tokens
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
      const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
      const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
      const redirectUri = Deno.env.get('MICROSOFT_REDIRECT_URI') || `${req.headers.get('origin')}/auth/callback`;

      if (!clientId || !clientSecret || !tenantId) {
        return new Response(JSON.stringify({ 
          error: 'OIDC configuration missing' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Exchange authorization code for tokens
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token exchange failed:', errorData);
        return new Response(JSON.stringify({ 
          error: 'Failed to exchange authorization code' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokens = await tokenResponse.json();
      
      // Decode ID token to get user info
      const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]));
      
      // Check if user exists in entra_credentials table
      const { data: entraUser, error: queryError } = await supabase
        .from('entra_credentials')
        .select('id, email, role, is_active')
        .eq('email', idTokenPayload.email)
        .eq('is_active', true)
        .single();

      if (queryError || !entraUser) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'User not found or not authorized for this application' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        user: {
          id: entraUser.id,
          email: entraUser.email,
          display_name: idTokenPayload.name,
          role: entraUser.role
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OIDC auth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
