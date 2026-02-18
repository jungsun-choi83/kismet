/**
 * Merged API: subscription, report, talisman-result, credits (saves 3 serverless functions for Hobby plan limit)
 * GET ?type=subscription|report|talisman|credits&telegram_user_id=...
 */
import type { VercelRequest, VercelResponse } from '../vercel'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const type = req.query?.type as string
  const telegramUserId = req.query?.telegram_user_id as string

  if (!telegramUserId) return res.status(400).json({ error: 'telegram_user_id required' })
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    if (type === 'subscription') return res.status(200).json({ active: false })
    return res.status(404).json({ error: 'Not found' })
  }

  try {
    const u = encodeURIComponent(telegramUserId)
    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }

    if (type === 'subscription') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${u}&product=eq.monthly_fortune&order=created_at.desc&limit=1&select=subscription_expires_at`, { headers })
      const rows = r.ok ? ((await r.json()) as { subscription_expires_at?: string }[]) : []
      const expires = rows[0]?.subscription_expires_at
      const active = expires ? new Date(expires) > new Date() : false
      return res.status(200).json({ active })
    }

    if (type === 'report') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${u}&product=eq.report&order=created_at.desc&limit=1&select=report_text`, { headers })
      const rows = r.ok ? ((await r.json()) as { report_text?: string }[]) : []
      const text = rows[0]?.report_text
      if (!text) return res.status(404).json({ error: 'Report not found' })
      return res.status(200).json({ report: text })
    }

    if (type === 'talisman') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${u}&product=eq.talisman&order=created_at.desc&limit=1&select=result_url,payload`, { headers })
      const rows = r.ok ? ((await r.json()) as { result_url?: string; payload?: { wish?: string; style?: string } }[]) : []
      const row = rows[0]
      if (!row?.result_url) return res.status(404).json({ error: 'Talisman not found' })
      const payload = row.payload as { wish?: string; style?: string } | undefined
      return res.status(200).json({ result_url: row.result_url, wish: payload?.wish ?? 'blessing', style: payload?.style ?? 'traditional' })
    }

    if (type === 'credits') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?telegram_user_id=eq.${u}&select=free_talisman_credits`, { headers })
      const rows = r.ok ? ((await r.json()) as { free_talisman_credits?: number }[]) : []
      const credits = rows[0]?.free_talisman_credits ?? 0
      return res.status(200).json({ free_talisman_credits: credits })
    }

    return res.status(400).json({ error: 'type required: subscription|report|talisman|credits' })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
