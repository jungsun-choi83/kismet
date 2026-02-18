/**
 * Vercel API proxy for Supabase Edge Function: calculate-saju
 * 브라우저 → Vercel (동일 origin) → Supabase Edge Function
 * CORS/네트워크 제한 우회용 프록시
 */
import type { VercelRequest, VercelResponse } from '../vercel'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  const functionUrl = `${SUPABASE_URL}/functions/v1/calculate-saju`

  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const proxyRes = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(body),
    })

    const text = await proxyRes.text()
    const data = text ? JSON.parse(text) : {}

    if (!proxyRes.ok) {
      return res.status(proxyRes.status).json(data)
    }
    return res.status(200).json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return res.status(500).json({ error: `Failed to call Edge Function: ${msg}` })
  }
}
