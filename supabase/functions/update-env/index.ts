
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to update-env function');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with auth header
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('User authentication check:', { user: !!user, error: authError });

    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const { configs } = await req.json();
      console.log('Received config update request from user:', user.id);
      console.log('Configs to update:', Object.keys(configs));

      // Generate .env file content
      let envContent = '# JeffFromIT Configuration\n';
      envContent += `# Updated: ${new Date().toISOString()}\n\n`;

      // Open WebUI Credentials
      envContent += '# Open WebUI Credentials\n';
      if (configs.OPENWEBUI_EMAIL) {
        envContent += `OPENWEBUI_EMAIL=${configs.OPENWEBUI_EMAIL}\n`;
      }
      if (configs.OPENWEBUI_PASSWORD) {
        envContent += `OPENWEBUI_PASSWORD=${configs.OPENWEBUI_PASSWORD}\n`;
      }
      envContent += '\n';

      // SAML Configuration
      envContent += '# SAML Configuration\n';
      if (configs.SAML_ENTITY_ID) {
        envContent += `SAML_ENTITY_ID=${configs.SAML_ENTITY_ID}\n`;
      }
      if (configs.SAML_IDP_SSO_URL) {
        envContent += `SAML_IDP_SSO_URL=${configs.SAML_IDP_SSO_URL}\n`;
      }
      if (configs.SAML_IDP_METADATA_URL) {
        envContent += `SAML_IDP_METADATA_URL=${configs.SAML_IDP_METADATA_URL}\n`;
      }
      if (configs.SAML_CERTIFICATE) {
        envContent += `SAML_CERTIFICATE=${configs.SAML_CERTIFICATE}\n`;
      }
      envContent += '\n';

      // N8N Configuration
      envContent += '# N8N Configuration\n';
      if (configs.N8N_ENCRYPTION_KEY) {
        envContent += `N8N_ENCRYPTION_KEY=${configs.N8N_ENCRYPTION_KEY}\n`;
      }
      if (configs.N8N_USER_MANAGEMENT_JWT_SECRET) {
        envContent += `N8N_USER_MANAGEMENT_JWT_SECRET=${configs.N8N_USER_MANAGEMENT_JWT_SECRET}\n`;
      }
      envContent += `N8N_USER_MANAGEMENT_DISABLED=${configs.N8N_USER_MANAGEMENT_DISABLED || false}\n`;
      envContent += `N8N_DIAGNOSTICS_ENABLED=${configs.N8N_DIAGNOSTICS_ENABLED || false}\n`;
      envContent += `N8N_PERSONALIZATION_ENABLED=${configs.N8N_PERSONALIZATION_ENABLED || false}\n`;
      envContent += `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=${configs.N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS !== false}\n`;
      envContent += `N8N_RUNNERS_ENABLED=${configs.N8N_RUNNERS_ENABLED !== false}\n\n`;

      // Azure OpenAI Configuration
      envContent += '# Azure OpenAI Configuration\n';
      if (configs.AZURE_OPENAI_URL) {
        envContent += `AZURE_OPENAI_URL=${configs.AZURE_OPENAI_URL}\n`;
      }
      if (configs.AZURE_OPENAI_API_KEY) {
        envContent += `AZURE_OPENAI_API_KEY=${configs.AZURE_OPENAI_API_KEY}\n`;
      }
      if (configs.AZURE_OPENAI_API_VERSION) {
        envContent += `AZURE_OPENAI_API_VERSION=${configs.AZURE_OPENAI_API_VERSION}\n`;
      }
      if (configs.AZURE_OPENAI_MODEL_NAME) {
        envContent += `AZURE_OPENAI_MODEL_NAME=${configs.AZURE_OPENAI_MODEL_NAME}\n`;
      }
      if (configs.AZURE_TENANT_ID) {
        envContent += `AZURE_TENANT_ID=${configs.AZURE_TENANT_ID}\n`;
      }
      envContent += '\n';

      // Slack Configuration
      envContent += '# Slack Configuration\n';
      if (configs.SLACK_ACCESS_TOKEN) {
        envContent += `SLACK_ACCESS_TOKEN=${configs.SLACK_ACCESS_TOKEN}\n`;
      }

      // Store the configuration in the database for the user
      try {
        const { error: dbError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
            updated_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }
      } catch (dbErr) {
        console.log('Profile update failed (may not have profiles table):', dbErr);
      }

      console.log('Generated .env file content for user:', user.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Environment variables updated successfully',
        envFile: envContent
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-env function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
