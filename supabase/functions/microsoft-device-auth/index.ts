
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MICROSOFT_TENANT_ID = 'common'; // Use 'common' for multi-tenant or your specific tenant ID
const CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID'); // Now configurable via Supabase secrets

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if CLIENT_ID is configured
    if (!CLIENT_ID) {
      console.error('MICROSOFT_CLIENT_ID environment variable is not set');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Microsoft Client ID is not configured. Please add MICROSOFT_CLIENT_ID to Supabase secrets.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, device_code, user_code } = await req.json();

    if (action === 'start_device_flow') {
      console.log('Starting device code flow with client ID:', CLIENT_ID.substring(0, 8) + '...');
      
      // Initiate device code flow
      const deviceCodeResponse = await fetch(
        `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/devicecode`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            scope: 'openid profile email User.Read',
          }),
        }
      );

      if (!deviceCodeResponse.ok) {
        const errorText = await deviceCodeResponse.text();
        console.error('Device code flow failed:', errorText);
        throw new Error('Failed to initiate device code flow');
      }

      const deviceData = await deviceCodeResponse.json();
      console.log('Device code flow initiated successfully');
      
      return new Response(JSON.stringify({
        success: true,
        device_code: deviceData.device_code,
        user_code: deviceData.user_code,
        verification_uri: deviceData.verification_uri,
        expires_in: deviceData.expires_in,
        interval: deviceData.interval
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'poll_token') {
      // Poll for token
      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            client_id: CLIENT_ID,
            device_code: device_code,
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        if (tokenData.error === 'authorization_pending') {
          return new Response(JSON.stringify({
            success: false,
            pending: true,
            error: 'authorization_pending'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (tokenData.error === 'authorization_declined') {
          return new Response(JSON.stringify({
            success: false,
            error: 'User declined authorization'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (tokenData.error === 'expired_token') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Device code expired'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Get user info from Microsoft Graph
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }

      const userData = await userResponse.json();

      // Store or update user in database
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      
      const { data: existingUser } = await supabase
        .from('entra_users')
        .select('*')
        .eq('microsoft_user_id', userData.id)
        .single();

      let user;
      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('entra_users')
          .update({
            email: userData.mail || userData.userPrincipalName,
            display_name: userData.displayName,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('microsoft_user_id', userData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        user = updatedUser;
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('entra_users')
          .insert({
            microsoft_user_id: userData.id,
            email: userData.mail || userData.userPrincipalName,
            display_name: userData.displayName,
            tenant_id: tokenData.tid || 'unknown',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;
        user = newUser;
      }

      console.log('User authenticated successfully:', user.email);

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          microsoft_user_id: user.microsoft_user_id
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
    console.error('Microsoft Device Auth error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
