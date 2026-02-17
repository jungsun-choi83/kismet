/**
 * Monthly budget cap checker ($50/month) and cost tracking
 * For Supabase Edge Functions (Deno)
 */
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const BOT_TOKEN = Deno.env.get('BOT_TOKEN')
const ADMIN_CHAT_ID = Deno.env.get('ADMIN_CHAT_ID')

const MONTHLY_BUDGET_CAP = 50.0

const PRICING = {
  'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 },
  'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
  'dall-e-3': { perImage: 0.04 },
}

export interface BudgetCheckResult {
  allowed: boolean
  currentCost: number
  budgetCap: number
  isCapped: boolean
}

function getCurrentMonthYear(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function checkMonthlyBudget(): Promise<BudgetCheckResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
  }

  try {
    const monthYear = getCurrentMonthYear()
    const url = `${SUPABASE_URL}/rest/v1/monthly_budget?month_year=eq.${monthYear}&select=total_cost_usd,budget_cap_usd,is_capped`
    
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })

    if (!res.ok) {
      console.error('Failed to check monthly budget:', res.statusText)
      return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
    }

    const rows = (await res.json()) as {
      total_cost_usd?: number
      budget_cap_usd?: number
      is_capped?: boolean
    }[]

    const row = rows[0]
    const currentCost = Number(row?.total_cost_usd ?? 0)
    const budgetCap = Number(row?.budget_cap_usd ?? MONTHLY_BUDGET_CAP)
    const isCapped = row?.is_capped ?? false

    if (currentCost >= budgetCap || isCapped) {
      return {
        allowed: false,
        currentCost,
        budgetCap,
        isCapped: true,
      }
    }

    return {
      allowed: true,
      currentCost,
      budgetCap,
      isCapped: false,
    }
  } catch (error) {
    console.error('Error checking monthly budget:', error)
    return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
  }
}

export function calculateCost(
  model: 'gpt-4o' | 'gpt-4o-mini' | 'dall-e-3',
  tokensInput?: number,
  tokensOutput?: number
): number {
  if (model === 'dall-e-3') {
    return PRICING['dall-e-3'].perImage
  }

  const pricing = PRICING[model]
  if (!pricing) return 0

  const inputCost = (tokensInput ?? 0) * pricing.input
  const outputCost = (tokensOutput ?? 0) * pricing.output
  return inputCost + outputCost
}

export async function recordUsage(
  model: 'gpt-4o' | 'gpt-4o-mini' | 'dall-e-3',
  cost: number,
  telegramUserId?: number,
  tokensInput?: number,
  tokensOutput?: number,
  isFreeUser: boolean = true
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    const monthYear = getCurrentMonthYear()

    await fetch(`${SUPABASE_URL}/rest/v1/api_usage_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
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

    const checkUrl = `${SUPABASE_URL}/rest/v1/monthly_budget?month_year=eq.${monthYear}&select=total_cost_usd,usage_count,is_capped`
    const checkRes = await fetch(checkUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })

    let currentCost = 0
    let usageCount = 0
    let isCapped = false

    if (checkRes.ok) {
      const rows = (await checkRes.json()) as {
        total_cost_usd?: number
        usage_count?: number
        is_capped?: boolean
      }[]
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
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
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

    if (shouldCap && BOT_TOKEN && ADMIN_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: `⚠️ Monthly Budget Cap Reached!\n\nMonth: ${monthYear}\nTotal Cost: $${newCost.toFixed(2)}\nBudget Cap: $${budgetCap}\nAll AI calls are now blocked until next month or budget reset.`,
          parse_mode: 'HTML',
        }),
      }).catch((e) => console.error('Error sending admin notification:', e))
    }
  } catch (error) {
    console.error('Error recording API usage:', error)
  }
}
