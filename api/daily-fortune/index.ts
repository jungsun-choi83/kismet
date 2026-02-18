/**
 * Vercel API: Daily Fortune - NO Edge Function.
 * Full implementation: OpenAI + Supabase.
 */
import type { VercelRequest, VercelResponse } from '../vercel'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const MONTHLY_BUDGET_CAP = 50.0
const DAILY_LIMIT = 3

const PRICING = { 'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 } }

function getCurrentMonthYear(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

async function checkMonthlyBudget(): Promise<{ allowed: boolean }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { allowed: true }
  try {
    const m = getCurrentMonthYear()
    const r = await fetch(`${SUPABASE_URL}/rest/v1/monthly_budget?month_year=eq.${m}&select=total_cost_usd,budget_cap_usd,is_capped`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!r.ok) return { allowed: true }
    const rows = (await r.json()) as { total_cost_usd?: number; budget_cap_usd?: number; is_capped?: boolean }[]
    const row = rows[0]
    const cost = Number(row?.total_cost_usd ?? 0)
    const cap = Number(row?.budget_cap_usd ?? MONTHLY_BUDGET_CAP)
    if (cost >= cap || row?.is_capped) return { allowed: false }
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

async function checkDailyUsageLimit(telegramUserId: number): Promise<{ allowed: boolean; message?: string }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { allowed: true }
  try {
    const today = new Date().toISOString().split('T')[0]
    const r = await fetch(`${SUPABASE_URL}/rest/v1/daily_ai_usage?telegram_user_id=eq.${telegramUserId}&usage_date=eq.${today}&select=usage_count`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!r.ok) return { allowed: true }
    const rows = (await r.json()) as { usage_count?: number }[]
    const count = rows[0]?.usage_count ?? 0
    if (count >= DAILY_LIMIT) {
      return { allowed: false, message: "You've reached your daily free limit. Come back tomorrow or unlock premium!" }
    }
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

async function recordUsage(model: string, cost: number, telegramUserId?: number, tokensInput?: number, tokensOutput?: number): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    const m = getCurrentMonthYear()
    await fetch(`${SUPABASE_URL}/rest/v1/api_usage_log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ telegram_user_id: telegramUserId ?? null, model, cost_usd: cost, tokens_input: tokensInput ?? null, tokens_output: tokensOutput ?? null, month_year: m, is_free_user: true }),
    })
    const check = await fetch(`${SUPABASE_URL}/rest/v1/monthly_budget?month_year=eq.${m}&select=total_cost_usd,usage_count,is_capped`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    let currentCost = 0
    let usageCount = 0
    let isCapped = false
    if (check.ok) {
      const rows = (await check.json()) as { total_cost_usd?: number; usage_count?: number; is_capped?: boolean }[]
      const row = rows[0]
      currentCost = Number(row?.total_cost_usd ?? 0)
      usageCount = Number(row?.usage_count ?? 0)
      isCapped = row?.is_capped ?? false
    }
    const newCost = currentCost + cost
    const shouldCap = newCost >= MONTHLY_BUDGET_CAP && !isCapped
    await fetch(`${SUPABASE_URL}/rest/v1/monthly_budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        month_year: m, total_cost_usd: newCost, usage_count: usageCount + 1, budget_cap_usd: MONTHLY_BUDGET_CAP,
        is_capped: shouldCap, capped_at: shouldCap ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
      }),
    })
  } catch {}
}

async function incrementDailyUsage(telegramUserId: number): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    const today = new Date().toISOString().split('T')[0]
    const check = await fetch(`${SUPABASE_URL}/rest/v1/daily_ai_usage?telegram_user_id=eq.${telegramUserId}&usage_date=eq.${today}&select=usage_count`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    let count = 0
    if (check.ok) {
      const rows = (await check.json()) as { usage_count?: number }[]
      count = rows[0]?.usage_count ?? 0
    }
    await fetch(`${SUPABASE_URL}/rest/v1/daily_ai_usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ telegram_user_id: telegramUserId, usage_date: today, usage_count: count + 1, updated_at: new Date().toISOString() }),
    })
  } catch {}
}

function calcCost(tokensInput?: number, tokensOutput?: number): number {
  const p = PRICING['gpt-4o-mini']
  return (tokensInput ?? 0) * p.input + (tokensOutput ?? 0) * p.output
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = (req.body ?? {}) as { dayMaster?: string; fiveElements?: unknown; date?: string; telegramUserId?: number }
    const { dayMaster, fiveElements, date, telegramUserId } = body

    let score = 70
    let summary = 'A balanced day ahead. Trust your intuition.'
    let wealth = 3
    let love = 4
    let career = 3
    let health = 4

    if (OPENAI_KEY && telegramUserId) {
      const budgetOk = await checkMonthlyBudget()
      if (!budgetOk.allowed) {
        return res.status(200).json({
          score: 0,
          summary: 'Monthly budget limit reached. Please try again later.',
          wealth: 0, love: 0, career: 0, health: 0,
        })
      }

      const usageOk = await checkDailyUsageLimit(telegramUserId)
      if (!usageOk.allowed) {
        return res.status(200).json({
          score: 0,
          summary: usageOk.message ?? "You've reached your daily free limit. Come back tomorrow!",
          wealth: 0, love: 0, career: 0, health: 0,
        })
      }

      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You provide daily fortune readings based on Four Pillars. Respond with JSON only: { "score": number 0-100, "summary": "2-3 sentence daily fortune", "wealth": 1-5, "love": 1-5, "career": 1-5, "health": 1-5 }' },
            { role: 'user', content: `Day master: ${dayMaster}. Five elements: ${JSON.stringify(fiveElements)}. Date: ${date}. Give today fortune.` },
          ],
          max_tokens: 500,
        }),
      })
      const data = (await aiRes.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } }
      const content = data?.choices?.[0]?.message?.content
      if (content) {
        try {
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim()) as Record<string, unknown>
          if (typeof parsed.score === 'number') score = parsed.score
          if (typeof parsed.summary === 'string') summary = parsed.summary
          if (typeof parsed.wealth === 'number') wealth = parsed.wealth
          if (typeof parsed.love === 'number') love = parsed.love
          if (typeof parsed.career === 'number') career = parsed.career
          if (typeof parsed.health === 'number') health = parsed.health
        } catch {}
      }

      const ti = data?.usage?.prompt_tokens
      const to = data?.usage?.completion_tokens
      const cost = calcCost(ti, to)
      await recordUsage('gpt-4o-mini', cost, telegramUserId, ti, to)
      await incrementDailyUsage(telegramUserId)
    }

    if (SUPABASE_URL && SUPABASE_KEY && telegramUserId) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
      const { data: userRow } = await supabase.from('users').select('id').eq('telegram_id', telegramUserId).single()
      if (userRow) {
        await supabase.from('daily_fortunes').upsert({
          user_id: userRow.id,
          date: date ?? new Date().toISOString().split('T')[0],
          fortune: { score, summary, wealth, love, career, health },
        }, { onConflict: 'user_id,date' })
      }
    }

    return res.status(200).json({ score, summary, wealth, love, career, health })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
