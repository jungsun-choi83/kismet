/**
 * Vercel Serverless Function: /api/generate-talisman
 * POST 요청으로 사주 데이터를 받아 AI 부적 이미지를 생성합니다.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config()

import type { VercelRequest, VercelResponse } from '../vercel'
import OpenAI from 'openai'

// Budget cap functions (inline to avoid module resolution issues in Vercel)
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const MONTHLY_BUDGET_CAP = 50.0

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
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
  }
  try {
    const monthYear = getCurrentMonthYear()
    const url = `${SUPABASE_URL}/rest/v1/monthly_budget?month_year=eq.${monthYear}&select=total_cost_usd,budget_cap_usd,is_capped`
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!res.ok) return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
    const rows = (await res.json()) as { total_cost_usd?: number; budget_cap_usd?: number; is_capped?: boolean }[]
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
  tokensOutput?: number
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    const monthYear = getCurrentMonthYear()
    await fetch(`${SUPABASE_URL}/rest/v1/api_usage_log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({
        telegram_user_id: telegramUserId ?? null,
        model,
        cost_usd: cost,
        tokens_input: tokensInput ?? null,
        tokens_output: tokensOutput ?? null,
        month_year: monthYear,
        is_free_user: false,
      }),
    })
    const checkUrl = `${SUPABASE_URL}/rest/v1/monthly_budget?month_year=eq.${monthYear}&select=total_cost_usd,usage_count,is_capped`
    const checkRes = await fetch(checkUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    let currentCost = 0
    let usageCount = 0
    let isCapped = false
    if (checkRes.ok) {
      const rows = (await checkRes.json()) as { total_cost_usd?: number; usage_count?: number; is_capped?: boolean }[]
      const row = rows[0]
      currentCost = Number(row?.total_cost_usd ?? 0)
      usageCount = Number(row?.usage_count ?? 0)
      isCapped = row?.is_capped ?? false
    }
    const newCost = currentCost + cost
    const newUsageCount = usageCount + 1
    const budgetCap = MONTHLY_BUDGET_CAP
    const shouldCap = newCost >= budgetCap && !isCapped
    await fetch(`${SUPABASE_URL}/rest/v1/monthly_budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'resolution=merge-duplicates' },
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
  } catch {
    // Don't throw - usage tracking failure shouldn't block the request
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function generateTalismanImage(
  sajuResult: { dayMaster?: string; fiveElements?: unknown },
  wish: string,
  style: string,
  telegramUserId?: number
): Promise<{ imageUrl: string; guide: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.')
  }

  // Check monthly budget cap
  const budgetCheck = await checkMonthlyBudget()
  if (!budgetCheck.allowed) {
    throw new Error('Monthly budget limit reached. Please try again later.')
  }

  const dayMaster = sajuResult?.dayMaster ?? ''
  let elements = ''
  if (sajuResult?.fiveElements && typeof sajuResult.fiveElements === 'object') {
    elements = Object.entries(sajuResult.fiveElements as Record<string, number>)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(', ')
  }

  const wishText = wish.replace(/([A-Z])/g, ' $1').trim().toLowerCase()
  
  // Wish category to symbol mapping
  const wishSymbols: Record<string, { central: string; patterns: string }> = {
    wealth: { central: 'treasure mandala, lotus flower', patterns: 'clouds, gold ingot patterns, waves' },
    love: { central: 'paired cranes, heart lotus', patterns: 'butterflies, knots, moon' },
    career: { central: 'dragon, phoenix, mountain', patterns: 'stairs, stars, sun' },
    health: { central: 'tortoise, crane, pine tree', patterns: 'herbs, water, wind' },
    examSuccess: { central: 'carp, dragon gate, brush', patterns: 'books, stars, gate' },
    protection: { central: 'bagua, tiger', patterns: 'sword, mirror, thunder' },
    family: { central: 'tree, house, roots', patterns: 'birds, flowers, fruits' },
  }
  const symbol = wishSymbols[wishText] || wishSymbols.wealth
  
  // Traditional East Asian talisman prompt
  const prompt = `Create a traditional East Asian talisman (부적/符籙) artwork.

Background: Aged yellow/golden parchment paper texture (#D4A017), slightly weathered.
Ink: Deep vermillion red (#CC2200, cinnabar red) brush calligraphy style.

Content based on the user's Saju analysis:
- The user's Day Master is ${dayMaster}.
- Their Five Elements balance: ${elements || 'balanced'}.
- Their wish category: ${wishText}.
- Style preference: ${style}.

Design the talisman with these elements:
- Central sacred geometric pattern or mandala symbolizing ${symbol.central}
- Surrounding decorative borders with traditional ${symbol.patterns} patterns
- Abstract mystical symbols and seal script (篆書) inspired brush strokes
- Small circular seal stamps (印章) in corners

CRITICAL STYLE RULES:
- DO NOT write actual readable Chinese/Korean characters or text. Instead use ABSTRACT brush stroke patterns that LOOK LIKE ancient mystical script but are decorative/artistic.
- The strokes should feel like ancient talismanic writing but be purely decorative.
- Hand-brushed, organic feel — NOT digital or clean vector.
- Slight ink bleeding and brush texture variations.
- Traditional composition: vertical orientation, symmetrical layout.
- Overall feel: authentic, sacred, hand-crafted, centuries-old wisdom.

Color palette: Vermillion red (#CC2200) ink on aged gold/yellow (#D4A017) paper.
Occasional black ink accents for seals and borders.
No modern elements, no English text, no watermarks.
4K high quality, square format.`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  })

  const imageUrl = response.data?.[0]?.url
  if (!imageUrl) throw new Error('이미지 생성에 실패했습니다.')

  const guideRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Write a short 3-4 sentence guide on how to use a talisman for the given wish. Be practical and mystical. Write in English.',
      },
      { role: 'user', content: `Wish: ${wishText}` },
    ],
  })

  const guide =
    guideRes.choices[0]?.message?.content?.trim() ??
    'Keep this talisman visible. Meditate on your wish while viewing it to amplify its energy.'

  // Record usage and cost
  const dallECost = calculateCost('dall-e-3')
  const guideTokensInput = guideRes.usage?.prompt_tokens
  const guideTokensOutput = guideRes.usage?.completion_tokens
  const guideCost = calculateCost('gpt-4o-mini', guideTokensInput, guideTokensOutput)

  await recordUsage('dall-e-3', dallECost, telegramUserId, undefined, undefined)
  await recordUsage('gpt-4o-mini', guideCost, telegramUserId, guideTokensInput, guideTokensOutput)

  return { imageUrl, guide }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = (req.body ?? {}) as {
      sajuResult?: { dayMaster?: string; fiveElements?: unknown }
      wish?: string
      style?: string
      telegramUserId?: number
    }
    const { sajuResult, wish, style, telegramUserId } = body
    
    const result = await generateTalismanImage(
      sajuResult ?? {},
      wish ?? '',
      style ?? 'traditional',
      telegramUserId
    )
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
}
