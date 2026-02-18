/**
 * POST: Generate monthly fortune for current month (requires active subscription).
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = (req.body ?? {}) as {
      telegram_user_id: number
      month: number
      year: number
    }
    const { telegram_user_id, month, year } = body
    if (!telegram_user_id || !month || !year) {
      return res.status(400).json({ error: 'telegram_user_id, month, year required' })
    }

    const sajuResult = await fetchSaju(telegram_user_id)
    if (!sajuResult) {
      return res.status(404).json({ error: 'Saju not found' })
    }

    const html = await generateMonthlyFortune(sajuResult, month, year, telegram_user_id)
    return res.status(200).json({ fortune: html })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
