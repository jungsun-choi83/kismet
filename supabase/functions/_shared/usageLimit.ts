/**
 * Daily usage limit checker for free users (3 AI calls per day)
 * For Supabase Edge Functions (Deno)
 */
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const DAILY_LIMIT = 3

export interface UsageCheckResult {
  allowed: boolean
  currentCount: number
  limit: number
  message?: string
}

/**
 * Check if a free user can make an AI call today
 */
export async function checkDailyUsageLimit(
  telegramUserId: number
): Promise<UsageCheckResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { allowed: true, currentCount: 0, limit: DAILY_LIMIT }
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const url = `${SUPABASE_URL}/rest/v1/daily_ai_usage?telegram_user_id=eq.${telegramUserId}&usage_date=eq.${today}&select=usage_count`
    
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })

    if (!res.ok) {
      console.error('Failed to check daily usage:', res.statusText)
      return { allowed: true, currentCount: 0, limit: DAILY_LIMIT }
    }

    const rows = (await res.json()) as { usage_count?: number }[]
    const currentCount = rows[0]?.usage_count ?? 0

    if (currentCount >= DAILY_LIMIT) {
      return {
        allowed: false,
        currentCount,
        limit: DAILY_LIMIT,
        message: "You've reached your daily free limit. Come back tomorrow or unlock premium!",
      }
    }

    return {
      allowed: true,
      currentCount,
      limit: DAILY_LIMIT,
    }
  } catch (error) {
    console.error('Error checking daily usage limit:', error)
    return { allowed: true, currentCount: 0, limit: DAILY_LIMIT }
  }
}

/**
 * Increment daily usage count for a user
 */
export async function incrementDailyUsage(telegramUserId: number): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    const today = new Date().toISOString().split('T')[0]
    const checkUrl = `${SUPABASE_URL}/rest/v1/daily_ai_usage?telegram_user_id=eq.${telegramUserId}&usage_date=eq.${today}&select=usage_count`
    
    const checkRes = await fetch(checkUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })

    let currentCount = 0
    if (checkRes.ok) {
      const rows = (await checkRes.json()) as { usage_count?: number }[]
      currentCount = rows[0]?.usage_count ?? 0
    }

    const url = `${SUPABASE_URL}/rest/v1/daily_ai_usage`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        telegram_user_id: telegramUserId,
        usage_date: today,
        usage_count: currentCount + 1,
        updated_at: new Date().toISOString(),
      }),
    })
  } catch (error) {
    console.error('Error incrementing daily usage:', error)
  }
}
