/**
 * GET: Fetch latest couple compatibility report for a user.
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
    return res.status(404).json({ error: 'Report not found' })
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${encodeURIComponent(telegramUserId)}&product=eq.couple&order=created_at.desc&limit=1&select=couple_report_text`
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!r.ok) return res.status(404).json({ error: 'Report not found' })
    const rows = (await r.json()) as { couple_report_text: string | null }[]
    const reportText = rows[0]?.couple_report_text
    if (!reportText) return res.status(404).json({ error: 'Report not found' })
    return res.status(200).json({ report: reportText })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
