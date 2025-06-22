
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
    const url = new URL(req.url);
    const path = url.pathname;

    // SAML metadata endpoint
    if (path === '/saml-auth/metadata' && req.method === 'GET') {
      const entityId = Deno.env.get('SAML_ENTITY_ID') || `${url.origin}/saml-auth/metadata`;
      const acsUrl = `${url.origin}/saml-auth/acs`;
      
      const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" 
                     entityID="${entityId}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService index="0" 
                                isDefault="true" 
                                Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" 
                                Location="${acsUrl}" />
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

      return new Response(metadata, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // SAML login initiation
    if (path === '/saml-auth/login' && req.method === 'POST') {
      const { returnUrl } = await req.json();
      
      const samlIssuer = Deno.env.get('SAML_IDP_SSO_URL');
      const entityId = Deno.env.get('SAML_ENTITY_ID') || `${url.origin}/saml-auth/metadata`;
      const acsUrl = `${url.origin}/saml-auth/acs`;
      
      if (!samlIssuer) {
        return new Response(JSON.stringify({ error: 'SAML not configured' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate SAML AuthnRequest (simplified)
      const requestId = `_${crypto.randomUUID()}`;
      const timestamp = new Date().toISOString();
      
      const samlRequest = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                                             xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                                             ID="${requestId}"
                                             Version="2.0"
                                             IssueInstant="${timestamp}"
                                             Destination="${samlIssuer}"
                                             AssertionConsumerServiceURL="${acsUrl}">
        <saml:Issuer>${entityId}</saml:Issuer>
      </samlp:AuthnRequest>`;

      // Base64 encode the request
      const encodedRequest = btoa(samlRequest);
      const redirectUrl = `${samlIssuer}?SAMLRequest=${encodeURIComponent(encodedRequest)}`;
      
      if (returnUrl) {
        // Store return URL in a temporary way (in a real implementation, use a secure session store)
        console.log('Storing return URL:', returnUrl);
      }

      return new Response(JSON.stringify({ 
        redirectUrl,
        entityId,
        acsUrl 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SAML Assertion Consumer Service (ACS)
    if (path === '/saml-auth/acs' && req.method === 'POST') {
      const formData = await req.formData();
      const samlResponse = formData.get('SAMLResponse');
      
      if (!samlResponse) {
        return new Response('Missing SAML Response', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      try {
        // Decode SAML response
        const decodedResponse = atob(samlResponse.toString());
        console.log('SAML Response received:', decodedResponse.substring(0, 200) + '...');

        // In a real implementation, you would:
        // 1. Validate the SAML response signature
        // 2. Parse the XML to extract user attributes
        // 3. Verify the response is not expired
        // 4. Check the audience restriction

        // For this implementation, we'll extract basic info using regex (not recommended for production)
        const emailMatch = decodedResponse.match(/emailaddress[^>]*>([^<]+)</i);
        const nameMatch = decodedResponse.match(/givenname[^>]*>([^<]+)</i) || 
                         decodedResponse.match(/name[^>]*>([^<]+)</i);
        
        const email = emailMatch ? emailMatch[1] : null;
        const name = nameMatch ? nameMatch[1] : null;

        if (!email) {
          throw new Error('No email found in SAML response');
        }

        // Create user session data
        const userData = {
          id: crypto.randomUUID(),
          email: email,
          display_name: name || email.split('@')[0],
          auth_type: 'saml',
          role: 'user' // Default role, could be mapped from SAML attributes
        };

        // Return HTML that will handle the authentication result
        const callbackHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>SAML Authentication</title>
</head>
<body>
    <script>
        // Store authentication data and redirect
        localStorage.setItem('saml_auth', JSON.stringify(${JSON.stringify(userData)}));
        window.location.href = '/';
    </script>
    <p>Authenticating...</p>
</body>
</html>`;

        return new Response(callbackHtml, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/html' 
          }
        });

      } catch (error) {
        console.error('SAML processing error:', error);
        return new Response(`Authentication failed: ${error.message}`, { 
          status: 400,
          headers: corsHeaders 
        });
      }
    }

    return new Response('Not found', { 
      status: 404,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('SAML auth error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
