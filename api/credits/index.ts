/**
 * GET: Check free talisman credits for a user.
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
    return res.status(200).json({ free_talisman_credits: 0 })
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/user_credits?telegram_user_id=eq.${encodeURIComponent(telegramUserId)}&select=free_talisman_credits`
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!r.ok) return res.status(200).json({ free_talisman_credits: 0 })
    const rows = (await r.json()) as { free_talisman_credits: number }[]
    const credits = rows[0]?.free_talisman_credits ?? 0
    return res.status(200).json({ free_talisman_credits: credits })
  } catch (e) {
    return res.status(200).json({ free_talisman_credits: 0 })
  }
}
