/**
 * GET: Fetch latest talisman result_url for a user (for /talisman/result?paid=1).
 */
import type { VercelRequest, VercelResponse } from '../vercel'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const telegramUserId = req.query.telegram_user_id as string
  if (!telegramUserId) {
    return res.status(400).json({ error: 'telegram_user_id required' })
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(404).json({ error: 'Talisman not found' })
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${encodeURIComponent(telegramUserId)}&product=eq.talisman&order=created_at.desc&limit=1&select=result_url,payload`
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!r.ok) return res.status(404).json({ error: 'Talisman not found' })
    const rows = (await r.json()) as { result_url: string | null; payload?: unknown }[]
    const row = rows[0]
    if (!row?.result_url) return res.status(404).json({ error: 'Talisman not found' })
    const payload = row.payload as { wish?: string; style?: string } | undefined
    return res.status(200).json({
      result_url: row.result_url,
      wish: payload?.wish ?? 'blessing',
      style: payload?.style ?? 'traditional',
    })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
