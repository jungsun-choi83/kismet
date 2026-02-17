/**
 * GET: Check if user has active monthly fortune subscription (30-day access).
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
    return res.status(200).json({ active: false })
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${encodeURIComponent(telegramUserId)}&product=eq.monthly_fortune&order=created_at.desc&limit=1&select=subscription_expires_at`
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!r.ok) return res.status(200).json({ active: false })
    const rows = (await r.json()) as { subscription_expires_at: string | null }[]
    const expiresAt = rows[0]?.subscription_expires_at
    if (!expiresAt) return res.status(200).json({ active: false })
    const expires = new Date(expiresAt)
    const now = new Date()
    const active = expires > now
    return res.status(200).json({ active, expires_at: expiresAt })
  } catch (e) {
    return res.status(200).json({ active: false })
  }
}
