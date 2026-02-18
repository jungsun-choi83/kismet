/**
 * Vercel API: Calculate Saju (Four Pillars) - NO Edge Function.
 * Full implementation: Bazi + OpenAI + Supabase.
 */
import type { VercelRequest, VercelResponse } from '../vercel'
import { calculateBazi } from '../../server/lib/sajuCalc'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const MONTHLY_BUDGET_CAP = 50.0
const FREE_READINGS_LIMIT = 3
const DAILY_READINGS_LIMIT = 5

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

async function checkFreeReadingLimit(telegramUserId: number): Promise<{ allowed: boolean; isFree: boolean; freeReadingsUsed: number; dailyReadingsCount: number; message?: string }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { allowed: true, isFree: true, freeReadingsUsed: 0, dailyReadingsCount: 0 }
  try {
    const today = new Date().toISOString().split('T')[0]
    const r = await fetch(`${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=free_readings_used,daily_readings_count,daily_readings_date`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    let freeReadingsUsed = 0
    let dailyReadingsCount = 0
    let dailyReadingsDate: string | null = null
    if (r.ok) {
      const rows = (await r.json()) as { free_readings_used?: number; daily_readings_count?: number; daily_readings_date?: string }[]
      const row = rows[0]
      freeReadingsUsed = row?.free_readings_used ?? 0
      dailyReadingsCount = row?.daily_readings_count ?? 0
      dailyReadingsDate = row?.daily_readings_date ?? null
    }
    if (dailyReadingsDate !== today) dailyReadingsCount = 0
    if (dailyReadingsCount >= DAILY_READINGS_LIMIT) {
      return { allowed: false, isFree: false, freeReadingsUsed, dailyReadingsCount, message: "You've reached today's limit. Come back tomorrow! 🔮" }
    }
    return { allowed: true, isFree: freeReadingsUsed < FREE_READINGS_LIMIT, freeReadingsUsed, dailyReadingsCount }
  } catch {
    return { allowed: true, isFree: true, freeReadingsUsed: 0, dailyReadingsCount: 0 }
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

async function incrementReadingCount(telegramUserId: number, isFree: boolean): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    const today = new Date().toISOString().split('T')[0]
    const r = await fetch(`${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=free_readings_used,daily_readings_count,daily_readings_date`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    let freeReadingsUsed = 0
    let dailyReadingsCount = 0
    let dailyReadingsDate: string | null = null
    if (r.ok) {
      const rows = (await r.json()) as { free_readings_used?: number; daily_readings_count?: number; daily_readings_date?: string }[]
      const row = rows[0]
      freeReadingsUsed = row?.free_readings_used ?? 0
      dailyReadingsCount = row?.daily_readings_count ?? 0
      dailyReadingsDate = row?.daily_readings_date ?? null
    }
    if (dailyReadingsDate !== today) dailyReadingsCount = 0
    const newFree = isFree ? freeReadingsUsed + 1 : freeReadingsUsed
    await fetch(`${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ free_readings_used: newFree, daily_readings_count: dailyReadingsCount + 1, daily_readings_date: today }),
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
    const body = (req.body ?? {}) as {
      birthDate?: string
      birthTime?: string | null
      gender?: string
      calendarType?: string
      birthCity?: string | null
      latitude?: number | null
      longitude?: number | null
      timezoneOffset?: number | null
      timezoneName?: string | null
      telegramUserId?: number
      username?: string
    }
    const { birthDate, birthTime, gender, calendarType, birthCity, latitude, longitude, timezoneName, telegramUserId } = body
    if (!birthDate) return res.status(400).json({ error: 'birthDate required' })

    const cal = calendarType === 'lunar' ? 'lunar' : 'solar'
    const { fourPillars, fiveElements, dayMaster } = calculateBazi(birthDate, birthTime ?? null, cal)

    let overallReading = 'Your destiny is written in the stars. The Four Pillars reveal a unique path shaped by the elements.'
    let luckyColor = 'Gold'
    let luckyNumber = 7
    let yearlyFortune: string | undefined
    let bestMonths: Array<{ month: string; reason: string }> | undefined
    let cautionMonths: Array<{ month: string; reason: string }> | undefined
    let categories = {
      wealth: { score: 3, text: 'Moderate fortune in wealth. Stay diligent.', detail: '' },
      love: { score: 4, text: 'Good prospects in love. Be open to opportunities.', detail: '' },
      career: { score: 3, text: 'Steady career growth. Patience will reward you.', detail: '' },
      health: { score: 4, text: 'Generally good health. Maintain balance.', detail: '' },
    }

    if (OPENAI_KEY && telegramUserId) {
      const budgetOk = await checkMonthlyBudget()
      if (!budgetOk.allowed) {
        overallReading = 'Monthly budget limit reached. Please try again later.'
      } else {
        const limitCheck = await checkFreeReadingLimit(telegramUserId)
        if (!limitCheck.allowed) {
          overallReading = limitCheck.message ?? "You've reached today's limit. Come back tomorrow! 🔮"
        } else {
          const isFree = limitCheck.isFree
          const systemPrompt = `You are a master of Korean Saju (Four Pillars of Destiny). Given the birth chart, provide an insightful reading in English. Be mystical yet practical.
Respond with valid JSON only:
{"overallReading":"string","categories":{"wealth":{"score":1-5,"text":"","detail":""},"love":{},"career":{},"health":{}},"luckyColor":"string","luckyNumber":number,"yearlyFortune":"string","bestMonths":[{"month":"","reason":""}],"cautionMonths":[{"month":"","reason":""}]}`

          const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Four Pillars: ${JSON.stringify({ year: fourPillars.year, month: fourPillars.month, day: fourPillars.day, hour: fourPillars.hour })}. Five Elements: ${JSON.stringify(fiveElements)}. Gender: ${gender}. Provide the reading.` },
              ],
              max_tokens: 2000,
            }),
          })
          const data = (await aiRes.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } }
          const content = data?.choices?.[0]?.message?.content
          if (content) {
            try {
              const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim()) as Record<string, unknown>
              if (parsed.overallReading) overallReading = String(parsed.overallReading)
              if (parsed.categories && typeof parsed.categories === 'object') categories = parsed.categories as typeof categories
              if (parsed.luckyColor) luckyColor = String(parsed.luckyColor)
              if (typeof parsed.luckyNumber === 'number') luckyNumber = parsed.luckyNumber
              if (parsed.yearlyFortune) yearlyFortune = String(parsed.yearlyFortune)
              if (Array.isArray(parsed.bestMonths)) bestMonths = parsed.bestMonths as Array<{ month: string; reason: string }>
              if (Array.isArray(parsed.cautionMonths)) cautionMonths = parsed.cautionMonths as Array<{ month: string; reason: string }>
            } catch {}
          }

          const ti = data?.usage?.prompt_tokens
          const to = data?.usage?.completion_tokens
          const cost = calcCost(ti, to)
          await recordUsage('gpt-4o-mini', cost, telegramUserId, ti, to)
          await incrementDailyUsage(telegramUserId)
          await incrementReadingCount(telegramUserId, isFree)
        }
      }
    }

    const sajuResult: Record<string, unknown> = {
      fourPillars,
      fiveElements,
      overallReading,
      categories,
      luckyColor,
      luckyNumber,
      dayMaster,
    }
    if (yearlyFortune) sajuResult.yearlyFortune = yearlyFortune
    if (bestMonths) sajuResult.bestMonths = bestMonths
    if (cautionMonths) sajuResult.cautionMonths = cautionMonths

    if (SUPABASE_URL && SUPABASE_KEY && telegramUserId) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
      const { data: existing } = await supabase.from('users').select('id').eq('telegram_id', telegramUserId).maybeSingle()
      const userRow = {
        birth_date: birthDate,
        birth_time: birthTime ?? null,
        birth_city: birthCity ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        timezone_name: timezoneName ?? null,
        gender: gender ?? 'other',
        calendar_type: calendarType ?? 'solar',
        saju_result: sajuResult,
        updated_at: new Date().toISOString(),
      }
      if (existing) {
        await supabase.from('users').update(userRow).eq('telegram_id', telegramUserId)
      } else {
        await supabase.from('users').insert({
          telegram_id: telegramUserId,
          username: body.username ?? null,
          ...userRow,
        })
      }
    }

    return res.status(200).json(sajuResult)
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
