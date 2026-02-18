/**
 * Monthly budget cap checker - in api/lib (not a function)
 */
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID
const MONTHLY_BUDGET_CAP = 50.0

const PRICING = {
  'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 },
  'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
  'dall-e-3': { perImage: 0.04 },
}

function getCurrentMonthYear(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

export async function checkMonthlyBudget(): Promise<{ allowed: boolean; currentCost: number; budgetCap: number; isCapped: boolean }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
  try {
    const m = getCurrentMonthYear()
    const r = await fetch(`${SUPABASE_URL}/rest/v1/monthly_budget?month_year=eq.${m}&select=total_cost_usd,budget_cap_usd,is_capped`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
    if (!r.ok) return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false }
    const rows = (await r.json()) as { total_cost_usd?: number; budget_cap_usd?: number; is_capped?: boolean }[]
    const row = rows[0]
    const currentCost = Number(row?.total_cost_usd ?? 0)
    const budgetCap = Number(row?.budget_cap_usd ?? MONTHLY_BUDGET_CAP)
    const isCapped = row?.is_capped ?? false
    return { allowed: currentCost < budgetCap && !isCapped, currentCost, budgetCap, isCapped }
  } catch { return { allowed: true, currentCost: 0, budgetCap: MONTHLY_BUDGET_CAP, isCapped: false } }
}

export function calculateCost(model: 'gpt-4o' | 'gpt-4o-mini' | 'dall-e-3', tokensInput?: number, tokensOutput?: number): number {
  if (model === 'dall-e-3') return PRICING['dall-e-3'].perImage
  const p = PRICING[model]
  return p ? (tokensInput ?? 0) * p.input + (tokensOutput ?? 0) * p.output : 0
}

export async function recordUsage(model: 'gpt-4o' | 'gpt-4o-mini' | 'dall-e-3', cost: number, telegramUserId?: number, tokensInput?: number, tokensOutput?: number, isFreeUser = true): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    const m = getCurrentMonthYear()
    await fetch(`${SUPABASE_URL}/rest/v1/api_usage_log`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, body: JSON.stringify({ telegram_user_id: telegramUserId ?? null, model, cost_usd: cost, tokens_input: tokensInput ?? null, tokens_output: tokensOutput ?? null, month_year: m, is_free_user: isFreeUser }) })
    const check = await fetch(`${SUPABASE_URL}/rest/v1/monthly_budget?month_year=eq.${m}&select=total_cost_usd,usage_count,is_capped`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
    let currentCost = 0, usageCount = 0, isCapped = false
    if (check.ok) { const rows = (await check.json()) as { total_cost_usd?: number; usage_count?: number; is_capped?: boolean }[]; const r = rows[0]; currentCost = Number(r?.total_cost_usd ?? 0); usageCount = Number(r?.usage_count ?? 0); isCapped = r?.is_capped ?? false }
    const newCost = currentCost + cost
    const shouldCap = newCost >= MONTHLY_BUDGET_CAP && !isCapped
    await fetch(`${SUPABASE_URL}/rest/v1/monthly_budget`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ month_year: m, total_cost_usd: newCost, usage_count: usageCount + 1, budget_cap_usd: MONTHLY_BUDGET_CAP, is_capped: shouldCap, capped_at: shouldCap ? new Date().toISOString() : null, updated_at: new Date().toISOString() }) })
    if (shouldCap && BOT_TOKEN && ADMIN_CHAT_ID) {
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: `⚠️ Monthly Budget Cap Reached!\nMonth: ${m}`, parse_mode: 'HTML' }) }).catch(() => {})
    }
  } catch {}
}
