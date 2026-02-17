import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

// ============================================================================
// Inline shared functions (Supabase Edge Functions don't support _shared folder)
// ============================================================================

const SUPABASE_URL_SHARED = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY_SHARED = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const BOT_TOKEN_SHARED = Deno.env.get('BOT_TOKEN')
const ADMIN_CHAT_ID_SHARED = Deno.env.get('ADMIN_CHAT_ID')

const MONTHLY_BUDGET_CAP = 50.0
const FREE_READINGS_LIMIT = 3
const DAILY_READINGS_LIMIT = 5
const DAILY_LIMIT = 3

const PRICING = {
  'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 },
  'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
  'dall-e-3': { perImage: 0.04 },
}

function getCurrentMonthYear(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

async function checkMonthlyBudget(): Promise<{ allowed: boolean; currentCost: number; budgetCap: number; isCapped: boolean }> {
  if (!SUPABASE_URL_SHARED || !SUPABASE_KEY_SHARED) {
    return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
  }
  try {
    const monthYear = getCurrentMonthYear()
    const url = `${SUPABASE_URL_SHARED}/rest/v1/monthly_budget?month_year=eq.${monthYear}&select=total_cost_usd,budget_cap_usd,is_capped`
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}` },
    })
    if (!res.ok) {
      return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
    }
    const rows = (await res.json()) as Array<{ total_cost_usd?: number; budget_cap_usd?: number; is_capped?: boolean }>
    const row = rows[0]
    const currentCost = Number(row?.total_cost_usd ?? 0)
    const budgetCap = Number(row?.budget_cap_usd ?? MONTHLY_BUDGET_CAP)
    const isCapped = row?.is_capped ?? false
    if (currentCost >= budgetCap || isCapped) {
      return { allowed: false, currentCost, budgetCap, isCapped: true }
    }
    return { allowed: true, currentCost, budgetCap, isCapped: false }
  } catch {
    return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
  }
}

function calculateCost(model: 'gpt-4o' | 'gpt-4o-mini' | 'dall-e-3', tokensInput?: number, tokensOutput?: number): number {
  if (model === 'dall-e-3') return PRICING['dall-e-3'].perImage
  const pricing = PRICING[model]
  if (!pricing) return 0
  return (tokensInput ?? 0) * pricing.input + (tokensOutput ?? 0) * pricing.output
}

async function recordUsage(
  model: 'gpt-4o' | 'gpt-4o-mini' | 'dall-e-3',
  cost: number,
  telegramUserId?: number,
  tokensInput?: number,
  tokensOutput?: number,
  isFreeUser: boolean = true
): Promise<void> {
  if (!SUPABASE_URL_SHARED || !SUPABASE_KEY_SHARED) return
  try {
    const monthYear = getCurrentMonthYear()
    await fetch(`${SUPABASE_URL_SHARED}/rest/v1/api_usage_log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}` },
      body: JSON.stringify({
        telegram_user_id: telegramUserId ?? null,
        model,
        cost_usd: cost,
        tokens_input: tokensInput ?? null,
        tokens_output: tokensOutput ?? null,
        month_year: monthYear,
        is_free_user: isFreeUser,
      }),
    })
    const checkUrl = `${SUPABASE_URL_SHARED}/rest/v1/monthly_budget?month_year=eq.${monthYear}&select=total_cost_usd,usage_count,is_capped`
    const checkRes = await fetch(checkUrl, {
      headers: { apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}` },
    })
    let currentCost = 0
    let usageCount = 0
    let isCapped = false
    if (checkRes.ok) {
      const rows = (await checkRes.json()) as Array<{ total_cost_usd?: number; usage_count?: number; is_capped?: boolean }>
      const row = rows[0]
      currentCost = Number(row?.total_cost_usd ?? 0)
      usageCount = Number(row?.usage_count ?? 0)
      isCapped = row?.is_capped ?? false
    }
    const newCost = currentCost + cost
    const newUsageCount = usageCount + 1
    const budgetCap = MONTHLY_BUDGET_CAP
    const shouldCap = newCost >= budgetCap && !isCapped
    await fetch(`${SUPABASE_URL_SHARED}/rest/v1/monthly_budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}`, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        month_year: monthYear,
        total_cost_usd: newCost,
        usage_count: newUsageCount,
        budget_cap_usd: budgetCap,
        is_capped: shouldCap,
        capped_at: shouldCap ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }),
    })
    if (shouldCap && BOT_TOKEN_SHARED && ADMIN_CHAT_ID_SHARED) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN_SHARED}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID_SHARED,
          text: `⚠️ Monthly Budget Cap Reached!\n\nMonth: ${monthYear}\nTotal Cost: $${newCost.toFixed(2)}\nBudget Cap: $${budgetCap}\nAll AI calls are now blocked until next month or budget reset.`,
          parse_mode: 'HTML',
        }),
      }).catch(() => {})
    }
  } catch {}
}

async function checkFreeReadingLimit(telegramUserId: number): Promise<{ allowed: boolean; isFree: boolean; freeReadingsUsed: number; dailyReadingsCount: number; message?: string }> {
  if (!SUPABASE_URL_SHARED || !SUPABASE_KEY_SHARED) {
    return { allowed: true, isFree: true, freeReadingsUsed: 0, dailyReadingsCount: 0 }
  }
  try {
    const today = new Date().toISOString().split('T')[0]
    const userUrl = `${SUPABASE_URL_SHARED}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=free_readings_used,daily_readings_count,daily_readings_date`
    const userRes = await fetch(userUrl, {
      headers: { apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}` },
    })
    let freeReadingsUsed = 0
    let dailyReadingsCount = 0
    let dailyReadingsDate: string | null = null
    if (userRes.ok) {
      const rows = (await userRes.json()) as Array<{ free_readings_used?: number; daily_readings_count?: number; daily_readings_date?: string }>
      const row = rows[0]
      freeReadingsUsed = row?.free_readings_used ?? 0
      dailyReadingsCount = row?.daily_readings_count ?? 0
      dailyReadingsDate = row?.daily_readings_date ?? null
    }
    if (dailyReadingsDate !== today) {
      dailyReadingsCount = 0
    }
    if (dailyReadingsCount >= DAILY_READINGS_LIMIT) {
      return {
        allowed: false,
        isFree: false,
        freeReadingsUsed,
        dailyReadingsCount,
        message: "You've reached today's limit. Come back tomorrow for more insights! 🔮",
      }
    }
    const isFree = freeReadingsUsed < FREE_READINGS_LIMIT
    return {
      allowed: true,
      isFree,
      freeReadingsUsed,
      dailyReadingsCount,
    }
  } catch {
    return { allowed: true, isFree: true, freeReadingsUsed: 0, dailyReadingsCount: 0 }
  }
}

async function incrementReadingCount(telegramUserId: number, isFree: boolean): Promise<void> {
  if (!SUPABASE_URL_SHARED || !SUPABASE_KEY_SHARED) return
  try {
    const today = new Date().toISOString().split('T')[0]
    const userUrl = `${SUPABASE_URL_SHARED}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=free_readings_used,daily_readings_count,daily_readings_date`
    const userRes = await fetch(userUrl, {
      headers: { apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}` },
    })
    let freeReadingsUsed = 0
    let dailyReadingsCount = 0
    let dailyReadingsDate: string | null = null
    if (userRes.ok) {
      const rows = (await userRes.json()) as Array<{ free_readings_used?: number; daily_readings_count?: number; daily_readings_date?: string }>
      const row = rows[0]
      freeReadingsUsed = row?.free_readings_used ?? 0
      dailyReadingsCount = row?.daily_readings_count ?? 0
      dailyReadingsDate = row?.daily_readings_date ?? null
    }
    if (dailyReadingsDate !== today) {
      dailyReadingsCount = 0
    }
    const newFreeReadingsUsed = isFree ? freeReadingsUsed + 1 : freeReadingsUsed
    const newDailyReadingsCount = dailyReadingsCount + 1
    await fetch(`${SUPABASE_URL_SHARED}/rest/v1/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}` },
      body: JSON.stringify({
        telegram_id: telegramUserId,
        free_readings_used: newFreeReadingsUsed,
        daily_readings_count: newDailyReadingsCount,
        daily_readings_date: today,
      }),
    })
  } catch {}
}

async function incrementDailyUsage(telegramUserId: number): Promise<void> {
  if (!SUPABASE_URL_SHARED || !SUPABASE_KEY_SHARED) return
  try {
    const today = new Date().toISOString().split('T')[0]
    const checkUrl = `${SUPABASE_URL_SHARED}/rest/v1/daily_ai_usage?telegram_user_id=eq.${telegramUserId}&usage_date=eq.${today}&select=usage_count`
    const checkRes = await fetch(checkUrl, {
      headers: { apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}` },
    })
    let currentCount = 0
    if (checkRes.ok) {
      const rows = (await checkRes.json()) as Array<{ usage_count?: number }>
      currentCount = rows[0]?.usage_count ?? 0
    }
    await fetch(`${SUPABASE_URL_SHARED}/rest/v1/daily_ai_usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY_SHARED, Authorization: `Bearer ${SUPABASE_KEY_SHARED}`, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        telegram_user_id: telegramUserId,
        usage_date: today,
        usage_count: currentCount + 1,
        updated_at: new Date().toISOString(),
      }),
    })
  } catch {}
}

// Simplified Four Pillars calculation (skeleton - full implementation needs full manseiryek)
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const TIAN_GAN_EN = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water']
const DI_ZHI_EN = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig']
const ELEMENT_MAP: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire', '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal', '壬': 'water', '癸': 'water',
  '寅': 'wood', '卯': 'wood', '巳': 'fire', '午': 'fire', '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
  '申': 'metal', '酉': 'metal', '亥': 'water', '子': 'water'
}

function getYearPillar(year: number) {
  const idx = (year - 4) % 60
  const tg = idx % 10
  const dz = idx % 12
  return { heavenlyStem: TIAN_GAN[tg], earthlyBranch: DI_ZHI[dz], heavenlyStemEnglish: TIAN_GAN_EN[tg], earthlyBranchEnglish: DI_ZHI_EN[dz], element: ELEMENT_MAP[TIAN_GAN[tg]] }
}

function getMonthPillar(year: number, month: number) {
  const yp = (year - 4) % 60
  const tgYear = yp % 10
  const monthIdx = (month - 1 + (tgYear * 2 + 2) % 12) % 12
  const tg = (tgYear * 2 + Math.floor(monthIdx / 2)) % 10
  const dz = (monthIdx + 2) % 12
  return { heavenlyStem: TIAN_GAN[tg], earthlyBranch: DI_ZHI[dz], heavenlyStemEnglish: TIAN_GAN_EN[tg], earthlyBranchEnglish: DI_ZHI_EN[dz], element: ELEMENT_MAP[TIAN_GAN[tg]] }
}

function getDayPillar(date: Date) {
  const base = new Date(1900, 0, 1)
  const diff = Math.floor((date.getTime() - base.getTime()) / 86400000)
  const idx = diff % 60
  const tg = idx % 10
  const dz = idx % 12
  return { heavenlyStem: TIAN_GAN[tg], earthlyBranch: DI_ZHI[dz], heavenlyStemEnglish: TIAN_GAN_EN[tg], earthlyBranchEnglish: DI_ZHI_EN[dz], element: ELEMENT_MAP[TIAN_GAN[tg]] }
}

function getHourPillar(dayGan: number, hour: number, lmtOffsetMinutes = 0) {
  const adjustedHour = hour + lmtOffsetMinutes / 60
  const dz = Math.floor((adjustedHour + 1) / 2) % 12
  const tg = (dayGan * 2 + Math.floor((dz + 2) / 2)) % 10
  return { heavenlyStem: TIAN_GAN[tg], earthlyBranch: DI_ZHI[dz], heavenlyStemEnglish: TIAN_GAN_EN[tg], earthlyBranchEnglish: DI_ZHI_EN[dz], element: ELEMENT_MAP[TIAN_GAN[tg]] }
}

// Hidden stems (지장간) within earthly branches with weights
const HIDDEN_STEMS: Record<string, Array<{ stem: string; element: string; weight: number }>> = {
  子: [{ stem: '癸', element: 'water', weight: 1.0 }],
  丑: [
    { stem: '己', element: 'earth', weight: 0.7 },
    { stem: '辛', element: 'metal', weight: 0.2 },
    { stem: '癸', element: 'water', weight: 0.1 },
  ],
  寅: [
    { stem: '甲', element: 'wood', weight: 0.7 },
    { stem: '丙', element: 'fire', weight: 0.2 },
    { stem: '戊', element: 'earth', weight: 0.1 },
  ],
  卯: [{ stem: '乙', element: 'wood', weight: 1.0 }],
  辰: [
    { stem: '戊', element: 'earth', weight: 0.7 },
    { stem: '乙', element: 'wood', weight: 0.2 },
    { stem: '癸', element: 'water', weight: 0.1 },
  ],
  巳: [
    { stem: '丙', element: 'fire', weight: 0.7 },
    { stem: '庚', element: 'metal', weight: 0.2 },
    { stem: '戊', element: 'earth', weight: 0.1 },
  ],
  午: [
    { stem: '丁', element: 'fire', weight: 0.7 },
    { stem: '己', element: 'earth', weight: 0.3 },
  ],
  未: [
    { stem: '己', element: 'earth', weight: 0.7 },
    { stem: '丁', element: 'fire', weight: 0.2 },
    { stem: '乙', element: 'wood', weight: 0.1 },
  ],
  申: [
    { stem: '庚', element: 'metal', weight: 0.7 },
    { stem: '壬', element: 'water', weight: 0.2 },
    { stem: '戊', element: 'earth', weight: 0.1 },
  ],
  酉: [{ stem: '辛', element: 'metal', weight: 1.0 }],
  戌: [
    { stem: '戊', element: 'earth', weight: 0.7 },
    { stem: '辛', element: 'metal', weight: 0.2 },
    { stem: '丁', element: 'fire', weight: 0.1 },
  ],
  亥: [
    { stem: '壬', element: 'water', weight: 0.7 },
    { stem: '甲', element: 'wood', weight: 0.3 },
  ],
}

function computeFiveElements(pillars: { heavenlyStem: string; earthlyBranch: string }[]) {
  const counts: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  
  // Count heavenly stems (천간) - weight 1.0
  for (const p of pillars) {
    const e1 = ELEMENT_MAP[p.heavenlyStem]
    if (e1) counts[e1] = (counts[e1] ?? 0) + 1.0
  }
  
  // Count hidden stems (지장간) from earthly branches
  for (const p of pillars) {
    if (p.earthlyBranch) {
      const hidden = HIDDEN_STEMS[p.earthlyBranch]
      if (hidden) {
        for (const h of hidden) {
          counts[h.element] = (counts[h.element] ?? 0) + h.weight
        }
      }
    }
  }
  
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return {
    wood: Math.round(((counts.wood ?? 0) / total) * 100),
    fire: Math.round(((counts.fire ?? 0) / total) * 100),
    earth: Math.round(((counts.earth ?? 0) / total) * 100),
    metal: Math.round(((counts.metal ?? 0) / total) * 100),
    water: Math.round(((counts.water ?? 0) / total) * 100),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { birthDate, birthTime, gender, calendarType, birthCity, latitude, longitude, timezoneOffset, timezoneName, telegramUserId } = body

    const [y, m, d] = birthDate.split('-').map(Number)
    let hour = 12
    if (birthTime) {
      const [h, min] = birthTime.split(':').map(Number)
      hour = h + min / 60
    }
    const date = new Date(y, m - 1, d)

    const yearPillar = getYearPillar(y)
    const monthPillar = getMonthPillar(y, m)
    const dayPillar = getDayPillar(date)

    let lmtOffset = 0
    if (longitude != null && timezoneOffset != null) {
      const stdLongitude = (timezoneOffset / 60) * 15
      lmtOffset = (longitude - stdLongitude) * 4
    }

    let hourPillar = null
    if (birthTime) {
      const dayIdx = Math.floor((date.getTime() - new Date(1900, 0, 1).getTime()) / 86400000) % 60
      const dayGan = dayIdx % 10
      hourPillar = getHourPillar(dayGan, hour, lmtOffset)
    }

    const fourPillars = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar }
    const allPillars = [yearPillar, monthPillar, dayPillar, hourPillar].filter(Boolean)
    const fiveElements = computeFiveElements(allPillars)
    const dayMaster = dayPillar.heavenlyStem

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    let overallReading = 'Your destiny is written in the stars. The Four Pillars reveal a unique path shaped by the elements.'
    let categories = {
      wealth: { score: 3, text: 'Moderate fortune in wealth. Stay diligent.' },
      love: { score: 4, text: 'Good prospects in love. Be open to opportunities.' },
      career: { score: 3, text: 'Steady career growth. Patience will reward you.' },
      health: { score: 4, text: 'Generally good health. Maintain balance.' },
    }

    if (openaiKey && telegramUserId) {
      // Check monthly budget cap first
      const budgetCheck = await checkMonthlyBudget()
      if (!budgetCheck.allowed) {
        overallReading = 'Monthly budget limit reached. Please try again later.'
        categories = {
          wealth: { score: 0, text: 'Service temporarily unavailable.' },
          love: { score: 0, text: 'Service temporarily unavailable.' },
          career: { score: 0, text: 'Service temporarily unavailable.' },
          health: { score: 0, text: 'Service temporarily unavailable.' },
        }
      } else {
        // Check free reading limit (3 free readings total) and daily limit (5 per day)
        const readingLimitCheck = await checkFreeReadingLimit(telegramUserId)
        if (!readingLimitCheck.allowed) {
          overallReading = readingLimitCheck.message || "You've reached today's limit. Come back tomorrow for more insights! 🔮"
          categories = {
            wealth: { score: 0, text: 'Daily limit reached.' },
            love: { score: 0, text: 'Daily limit reached.' },
            career: { score: 0, text: 'Daily limit reached.' },
            health: { score: 0, text: 'Daily limit reached.' },
          }
        } else {
          // Check if user has used all 3 free readings
          const isFree = readingLimitCheck.isFree
          if (!isFree && readingLimitCheck.freeReadingsUsed >= 3) {
            // User exceeded free limit - show message but still allow (they can pay for full reading)
            overallReading = "You've used all 3 free readings. Unlock unlimited readings with any purchase!"
          }
          
          // Proceed with AI call
          const pillarsStr = JSON.stringify(fourPillars)
          const systemPrompt = `You are a master of Korean Saju (Four Pillars of Destiny) based on "자평진전(Ziping Zhenzhuan)" Pattern Theory and "적천수(Ditian Shu)" Suppression-Facilitation Theory. 

Given the birth chart, provide an insightful reading in English. Be mystical yet practical, focusing on healing and energy-balancing (Spiritual Coaching style), not prediction.

The Five Elements balance provided includes both Heavenly Stems (천간) AND Hidden Stems within Earthly Branches (지장간). Use this more accurate analysis.

For each category (wealth, love, career, health), provide:
- score: 1-5 rating
- text: Short summary (1-2 sentences)
- detail: Detailed interpretation (2-3 sentences, premium content)

Also provide:
- yearlyFortune: 3-4 paragraphs about the current year's fortune (2025)
- bestMonths: Array of top 3 months with reasons: [{ month: "March", reason: "..." }, ...]
- cautionMonths: Array of 2 months to watch: [{ month: "July", reason: "..." }, ...]

Respond with valid JSON:
{
  "overallReading": string,
  "categories": {
    "wealth": { "score": number, "text": string, "detail": string },
    "love": { "score": number, "text": string, "detail": string },
    "career": { "score": number, "text": string, "detail": string },
    "health": { "score": number, "text": string, "detail": string }
  },
  "luckyColor": string,
  "luckyNumber": number,
  "yearlyFortune": string,
  "bestMonths": [{ "month": string, "reason": string }, ...],
  "cautionMonths": [{ "month": string, "reason": string }, ...]
}`

          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Four Pillars: ${pillarsStr}. Five Elements: ${JSON.stringify(fiveElements)}. Gender: ${gender}. Provide the reading.` },
              ],
              max_tokens: 2000,
            }),
          })
          const data = await res.json()
          const content = data?.choices?.[0]?.message?.content
          if (content) {
            try {
              const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
              if (parsed.overallReading) overallReading = parsed.overallReading
              if (parsed.categories) categories = parsed.categories
            } catch {}
          }

          // Record usage and cost
          const tokensInput = data?.usage?.prompt_tokens
          const tokensOutput = data?.usage?.completion_tokens
          const cost = calculateCost('gpt-4o-mini', tokensInput, tokensOutput)
          await recordUsage('gpt-4o-mini', cost, telegramUserId, tokensInput, tokensOutput, true)
          await incrementDailyUsage(telegramUserId)
          await incrementReadingCount(telegramUserId, isFree)
        }
      }
    }

    // Extract premium fields from categories if available
    const yearlyFortune = (categories as any).yearlyFortune
    const bestMonths = (categories as any).bestMonths
    const cautionMonths = (categories as any).cautionMonths
    
    // Clean categories (remove premium fields if they were mistakenly added)
    const cleanCategories = {
      wealth: { score: categories.wealth?.score ?? 3, text: categories.wealth?.text ?? '', detail: categories.wealth?.detail },
      love: { score: categories.love?.score ?? 3, text: categories.love?.text ?? '', detail: categories.love?.detail },
      career: { score: categories.career?.score ?? 3, text: categories.career?.text ?? '', detail: categories.career?.detail },
      health: { score: categories.health?.score ?? 3, text: categories.health?.text ?? '', detail: categories.health?.detail },
    }
    
    const sajuResult: any = {
      fourPillars,
      fiveElements,
      overallReading,
      categories: cleanCategories,
      luckyColor: (categories as any).luckyColor || 'Gold',
      luckyNumber: (categories as any).luckyNumber || 7,
      dayMaster,
    }
    
    // Add premium fields if available
    if (yearlyFortune) sajuResult.yearlyFortune = yearlyFortune
    if (bestMonths) sajuResult.bestMonths = bestMonths
    if (cautionMonths) sajuResult.cautionMonths = cautionMonths

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: existing } = await supabase.from('users').select('id').eq('telegram_id', telegramUserId).maybeSingle()
    if (existing) {
      await supabase.from('users').update({
        birth_date: birthDate,
        birth_time: birthTime || null,
        birth_city: birthCity || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        timezone_name: timezoneName ?? null,
        gender,
        calendar_type: calendarType || 'solar',
        saju_result: sajuResult,
        updated_at: new Date().toISOString(),
      }).eq('telegram_id', telegramUserId)
    } else {
      await supabase.from('users').insert({
        telegram_id: telegramUserId,
        username: body.username ?? null,
        birth_date: birthDate,
        birth_time: birthTime || null,
        birth_city: birthCity || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        timezone_name: timezoneName ?? null,
        gender,
        calendar_type: calendarType || 'solar',
        saju_result: sajuResult,
      })
    }

    return new Response(JSON.stringify(sajuResult), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
