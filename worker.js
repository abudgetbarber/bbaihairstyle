// ============================================================
// Budget Barber – Cloudflare Worker (API Proxy)
// Proxies:
//   POST /analyze  → Anthropic Claude  (face/style analysis)
//   POST /generate → Google Gemini 2.5 Flash Image (hairstyle grid)
//
// Environment variables required:
//   ANTHROPIC_API_KEY  = sk-ant-...
//   GEMINI_API_KEY     = AIza...
//
// CONFIGURE: Set your GitHub Pages origin below
// ============================================================
const ALLOWED_ORIGIN = 'https://abudgetbarber.github.io/';

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

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── Route 1: /analyze → Claude vision analysis ──────────────────
      if (path === '/analyze' || path === '/') {
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
      }

      // ── Route 2: /generate → Gemini 2.5 Flash Image generation ──────
      if (path === '/generate') {
        const body = await request.json();
        // body = { imageBase64: "...", mimeType: "image/jpeg" }

        const { imageBase64, mimeType } = body;
        if (!imageBase64) {
          return new Response(JSON.stringify({ error: 'imageBase64 required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const hairstylePrompt = `Use the uploaded image as a STRICT, NON-NEGOTIABLE identity reference.

ABSOLUTE FACE LOCK (HIGHEST PRIORITY):
- The face in the output MUST be identical to the uploaded image
- SAME facial geometry, SAME skin texture, SAME moles, SAME asymmetry
- SAME expression, SAME head tilt, SAME eye direction
- NO beautification, NO symmetry correction, NO aging or de-aging
- NO gender change, NO facial feature enhancement
- NO lighting changes that alter facial appearance

FIRST (INTERNAL STEP ONLY — DO NOT OUTPUT TEXT):
Analyze the uploaded face to determine:
- Face shape
- Hair density
- Hair texture and curl pattern
- Natural growth direction and hairline

SECOND (FINAL OUTPUT — IMAGE ONLY):
Generate ONE single vertical 9:16 composite image containing a 3x3 grid.

GRID RULES:
- 9 UNIQUE men's hairstyles (no repeats)
- Hairstyles applied realistically while preserving the EXACT SAME FACE
- Hair is the ONLY editable region
- Face, skin tone, shadows, proportions MUST remain unchanged in every tile

STRICT CONSISTENCY REQUIREMENTS:
- SAME pose, SAME camera angle, SAME focal length
- SAME background (clean neutral/white studio background), SAME lighting direction
- SAME facial expression across all 9 tiles

HAIRSTYLE VARIATION RULES — use these 9 specific Indian men's styles:
1. Classic Side Part (short, neat, professional)
2. Textured Crop (short, modern, slightly tousled top)
3. Low Fade with Quiff (sides faded, volume on top swept forward)
4. Undercut (longer top swept back, shaved sides)
5. Crew Cut (short all over, uniform length)
6. Pompadour (voluminous swept-back top, tight sides)
7. Buzz Cut (very short uniform all over)
8. French Crop (short fringe forward, tapered sides)
9. Slick Back (hair combed back with medium length, polished)

Style rules:
- Respect real hair density, texture, and scalp visibility
- Natural hairlines and realistic parting
- NO wigs, NO fantasy volume, NO AI over-styling
- Each tile must have a small white label at the bottom with the style name in clean dark text

TECHNICAL REQUIREMENTS:
- Vertical 9:16 layout
- High clarity, photorealistic hair texture and shadows
- Natural hair movement without distortion
- Clean neutral studio background behind each tile

ABSOLUTE RESTRICTIONS:
- OUTPUT IMAGE ONLY — no surrounding text or explanation outside the grid
- NO background changes (keep same neutral studio background)
- NO makeup or facial changes unless present in the original image

GOAL:
Create a barber-grade haircut reference grid where the uploaded face is IDENTICAL in all 9 tiles and ONLY the hairstyle changes.`;

        const geminiPayload = {
          contents: [
            {
              parts: [
                { text: hairstylePrompt },
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: '9:16',
            },
          },
        };

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload),
          }
        );

        const geminiData = await geminiResponse.json();

        if (!geminiResponse.ok) {
          return new Response(JSON.stringify({ error: geminiData }), {
            status: geminiResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Extract the generated image from Gemini response
        let generatedImageData = null;
        let generatedMimeType = 'image/png';

        const parts = geminiData?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && !part.thought) {
            generatedImageData = part.inlineData.data;
            generatedMimeType = part.inlineData.mimeType || 'image/png';
            break;
          }
        }

        if (!generatedImageData) {
          return new Response(
            JSON.stringify({ error: 'No image generated', raw: geminiData }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ imageData: generatedImageData, mimeType: generatedMimeType }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: { message: err.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
