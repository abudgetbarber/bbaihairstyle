// ============================================================
// Budget Barber – Cloudflare Worker (API Proxy)
// Deploy this at: https://workers.cloudflare.com
// Set environment variable: ANTHROPIC_API_KEY = sk-ant-...
//
// CONFIGURE: Replace YOURUSERNAME with your GitHub username below
// ============================================================
const ALLOWED_ORIGIN = 'https://abudgetbarber.github.io/'; // <-- update this

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const isAllowed =
      origin === ALLOWED_ORIGIN ||
      origin === 'http://localhost' ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1');

    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: err.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
