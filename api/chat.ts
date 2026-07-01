/**
 * Vercel Edge Function — /api/chat
 * Proxies to Anthropic API server-side so the API key never reaches the browser.
 * Set ANTHROPIC_API_KEY in Vercel environment variables (never in code or vercel.json).
 */
export const runtime = 'edge'

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI assistant not configured. Set ANTHROPIC_API_KEY in Vercel environment variables.' }), {
      status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  let body: { systemPrompt: string; messages: unknown[] }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const { systemPrompt, messages } = body
  if (!systemPrompt || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Missing systemPrompt or messages' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  })

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('Anthropic API error:', errText)
    return new Response(JSON.stringify({ error: `AI service error (${anthropicRes.status})` }), {
      status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const data = await anthropicRes.json() as { content?: Array<{ type: string; text?: string }> }
  const text = data.content?.find(b => b.type === 'text')?.text ?? ''

  return new Response(JSON.stringify({ text }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
