
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

    const { action, email, password, role, userId, currentUser } = await req.json();

    // Verify admin permissions
    const { data: adminCheck } = await supabase.rpc('is_admin', {
      p_username: currentUser
    });

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'list':
        const { data: users, error: listError } = await supabase
          .from('entra_credentials')
          .select('id, email, role, created_at, is_active');
        
        if (listError) throw listError;
        
        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'create':
        const { error: createError } = await supabase
          .from('entra_credentials')
          .insert({
            email,
            password_hash: `crypt('${password}', gen_salt('bf'))`,
            role: role || 'user'
          });
        
        if (createError) throw createError;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'update':
        const updateData: any = {};
        if (password) {
          updateData.password_hash = `crypt('${password}', gen_salt('bf'))`;
        }
        if (role) updateData.role = role;
        
        const { error: updateError } = await supabase
          .from('entra_credentials')
          .update(updateData)
          .eq('id', userId);
        
        if (updateError) throw updateError;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete':
        const { error: deleteError } = await supabase
          .from('entra_credentials')
          .delete()
          .eq('id', userId);
        
        if (deleteError) throw deleteError;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Entra ID user management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
