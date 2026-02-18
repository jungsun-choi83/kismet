/**
 * Merged API: subscription, report, talisman-result, credits, couple-result, monthly-fortune (saves 5 serverless functions)
 * GET ?type=subscription|report|talisman|credits|couple&telegram_user_id=...
 * POST ?type=monthly-fortune (body: {telegram_user_id, month, year})
 */
import type { VercelRequest, VercelResponse } from '../vercel'
import { generateMonthlyFortune } from '../lib/generateMonthlyFortune'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

async function fetchSaju(telegramUserId: number): Promise<Record<string, unknown> | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/saju_cache?telegram_user_id=eq.${telegramUserId}&select=saju_result`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  )
  if (!res.ok) return null
  const rows = (await res.json()) as { saju_result?: unknown }[]
  const row = rows[0]
  return row?.saju_result != null ? (row.saju_result as Record<string, unknown>) : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  
  const type = req.query?.type as string || (req.body as { type?: string })?.type
  const telegramUserId = req.query?.telegram_user_id as string || (req.body as { telegram_user_id?: number })?.telegram_user_id

  if (req.method === 'POST' && type === 'monthly-fortune') {
    if (!telegramUserId) return res.status(400).json({ error: 'telegram_user_id required' })
    try {
      const body = (req.body ?? {}) as { month?: number; year?: number }
      const { month, year } = body
      if (!month || !year) {
        return res.status(400).json({ error: 'month, year required' })
      }
      const sajuResult = await fetchSaju(Number(telegramUserId))
      if (!sajuResult) {
        return res.status(404).json({ error: 'Saju not found' })
      }
      const html = await generateMonthlyFortune(sajuResult, month, year, Number(telegramUserId))
      return res.status(200).json({ fortune: html })
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message })
    }
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    if (type === 'subscription') return res.status(200).json({ active: false })
    return res.status(404).json({ error: 'Not found' })
  }

  try {
    const u = encodeURIComponent(String(telegramUserId))
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

    if (type === 'couple') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${u}&product=eq.couple&order=created_at.desc&limit=1&select=couple_report_text`, { headers })
      const rows = r.ok ? ((await r.json()) as { couple_report_text?: string }[]) : []
      const reportText = rows[0]?.couple_report_text
      if (!reportText) return res.status(404).json({ error: 'Report not found' })
      return res.status(200).json({ report: reportText })
    }

    return res.status(400).json({ error: 'type required: subscription|report|talisman|credits|couple' })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
