
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

    if (req.method === 'POST') {
      const { configs } = await req.json();
      console.log('Received config update request');
      console.log('Configs to update:', Object.keys(configs));

      // Generate .env file content in the exact format requested
      let envContent = '';

      // N8N Configuration
      envContent += '# --- n8n ---\n';
      envContent += `N8N_ENCRYPTION_KEY=${configs.N8N_ENCRYPTION_KEY || ''}\n`;
      envContent += `N8N_USER_MANAGEMENT_JWT_SECRET=${configs.N8N_USER_MANAGEMENT_JWT_SECRET || ''}\n`;
      envContent += `N8N_USER_MANAGEMENT_DISABLED=${configs.N8N_USER_MANAGEMENT_DISABLED || false}\n`;
      envContent += `N8N_DIAGNOSTICS_ENABLED=${configs.N8N_DIAGNOSTICS_ENABLED || false}\n`;
      envContent += `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=${configs.N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS !== false}\n`;
      envContent += `N8N_RUNNERS_ENABLED=${configs.N8N_RUNNERS_ENABLED !== false}\n\n`;

      // Open WebUI Configuration
      envContent += '# --- open webui ---\n';
      envContent += `AUTO_CONTINUE_PROMPTS=${configs.AUTO_CONTINUE_PROMPTS || false}\n`;
      envContent += `ENABLE_CONVERSATION_TEMPLATES=${configs.ENABLE_CONVERSATION_TEMPLATES || false}\n`;
      envContent += `OPEN_WEBUI_EMAIL=${configs.OPEN_WEBUI_EMAIL || 'admin@admin.com'}\n`;
      envContent += `OPEN_WEBUI_PASSWORD=${configs.OPEN_WEBUI_PASSWORD || 'Shalom123!'}\n\n`;

      // Azure MCP Configuration
      envContent += '# --- Azure MCP ---\n';
      envContent += `AZURE_TENANT_ID=${configs.AZURE_TENANT_ID || ''}\n`;
      envContent += `AZURE_CLIENT_ID=${configs.AZURE_CLIENT_ID || ''}\n`;
      envContent += `AZURE_CLIENT_SECRET=${configs.AZURE_CLIENT_SECRET || ''}\n\n`;

      // Azure OpenAI Configuration
      envContent += '# --- Azure OpenAI ---\n';
      envContent += `AZURE_OPENAI_URL=${configs.AZURE_OPENAI_URL || ''}\n`;
      envContent += `AZURE_OPENAI_API_KEY=${configs.AZURE_OPENAI_API_KEY || ''}\n`;
      envContent += `AZURE_OPENAI_API_VERSION=${configs.AZURE_OPENAI_API_VERSION || ''}\n`;
      envContent += `AZURE_OPENAI_MODEL_NAME=${configs.AZURE_OPENAI_MODEL_NAME || ''}\n\n\n`;

      // Slack Configuration
      envContent += '# --- Slack ---\n';
      envContent += `SLACK_ACCESS_TOKEN=${configs.SLACK_ACCESS_TOKEN || ''}\n`;

      console.log('Generated .env file content');

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
