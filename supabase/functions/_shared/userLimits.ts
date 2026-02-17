/**
 * User reading limits checker (3 free readings total, 5 daily readings max)
 * For Supabase Edge Functions (Deno)
 */
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const FREE_READINGS_LIMIT = 3
const DAILY_READINGS_LIMIT = 5
const DAILY_TALISMAN_LIMIT = 3

export interface ReadingLimitCheck {
  allowed: boolean
  isFree: boolean
  freeReadingsUsed: number
  dailyReadingsCount: number
  message?: string
}

export interface TalismanLimitCheck {
  allowed: boolean
  dailyTalismanCount: number
  message?: string
}

/**
 * Check if user can make a free reading (3 free readings total)
 */
export async function checkFreeReadingLimit(telegramUserId: number): Promise<ReadingLimitCheck> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { allowed: true, isFree: true, freeReadingsUsed: 0, dailyReadingsCount: 0 }
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Check free readings used
    const userUrl = `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=free_readings_used,daily_readings_count,daily_readings_date`
    const userRes = await fetch(userUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    
    let freeReadingsUsed = 0
    let dailyReadingsCount = 0
    let dailyReadingsDate: string | null = null
    
    if (userRes.ok) {
      const rows = (await userRes.json()) as Array<{
        free_readings_used?: number
        daily_readings_count?: number
        daily_readings_date?: string
      }>
      const row = rows[0]
      freeReadingsUsed = row?.free_readings_used ?? 0
      dailyReadingsCount = row?.daily_readings_count ?? 0
      dailyReadingsDate = row?.daily_readings_date ?? null
    }
    
    // Reset daily count if date changed
    if (dailyReadingsDate !== today) {
      dailyReadingsCount = 0
    }
    
    // Check daily limit
    if (dailyReadingsCount >= DAILY_READINGS_LIMIT) {
      return {
        allowed: false,
        isFree: false,
        freeReadingsUsed,
        dailyReadingsCount,
        message: "You've reached today's limit. Come back tomorrow for more insights! 🔮",
      }
    }
    
    // Check free readings limit
    const isFree = freeReadingsUsed < FREE_READINGS_LIMIT
    
    return {
      allowed: true,
      isFree,
      freeReadingsUsed,
      dailyReadingsCount,
    }
  } catch (error) {
    console.error('Error checking free reading limit:', error)
    return { allowed: true, isFree: true, freeReadingsUsed: 0, dailyReadingsCount: 0 }
  }
}

/**
 * Increment reading count (free and daily)
 */
export async function incrementReadingCount(telegramUserId: number, isFree: boolean): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    const today = new Date().toISOString().split('T')[0]
    const userUrl = `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=free_readings_used,daily_readings_count,daily_readings_date`
    const userRes = await fetch(userUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    
    let freeReadingsUsed = 0
    let dailyReadingsCount = 0
    let dailyReadingsDate: string | null = null
    
    if (userRes.ok) {
      const rows = (await userRes.json()) as Array<{
        free_readings_used?: number
        daily_readings_count?: number
        daily_readings_date?: string
      }>
      const row = rows[0]
      freeReadingsUsed = row?.free_readings_used ?? 0
      dailyReadingsCount = row?.daily_readings_count ?? 0
      dailyReadingsDate = row?.daily_readings_date ?? null
    }
    
    // Reset daily count if date changed
    if (dailyReadingsDate !== today) {
      dailyReadingsCount = 0
    }
    
    // Increment counts
    const newFreeReadingsUsed = isFree ? freeReadingsUsed + 1 : freeReadingsUsed
    const newDailyReadingsCount = dailyReadingsCount + 1
    
    // Update user record
    await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        telegram_id: telegramUserId,
        free_readings_used: newFreeReadingsUsed,
        daily_readings_count: newDailyReadingsCount,
        daily_readings_date: today,
      }),
    })
  } catch (error) {
    console.error('Error incrementing reading count:', error)
  }
}

/**
 * Check talisman daily limit
 */
export async function checkTalismanLimit(telegramUserId: number): Promise<TalismanLimitCheck> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { allowed: true, dailyTalismanCount: 0 }
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const userUrl = `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=daily_talisman_count,daily_talisman_date`
    const userRes = await fetch(userUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    
    let dailyTalismanCount = 0
    let dailyTalismanDate: string | null = null
    
    if (userRes.ok) {
      const rows = (await userRes.json()) as Array<{
        daily_talisman_count?: number
        daily_talisman_date?: string
      }>
      const row = rows[0]
      dailyTalismanCount = row?.daily_talisman_count ?? 0
      dailyTalismanDate = row?.daily_talisman_date ?? null
    }
    
    // Reset if date changed
    if (dailyTalismanDate !== today) {
      dailyTalismanCount = 0
    }
    
    if (dailyTalismanCount >= DAILY_TALISMAN_LIMIT) {
      return {
        allowed: false,
        dailyTalismanCount,
        message: "You've reached today's limit. Come back tomorrow for more insights! 🔮",
      }
    }
    
    return {
      allowed: true,
      dailyTalismanCount,
    }
  } catch (error) {
    console.error('Error checking talisman limit:', error)
    return { allowed: true, dailyTalismanCount: 0 }
  }
}

/**
 * Increment talisman count
 */
export async function incrementTalismanCount(telegramUserId: number): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    const today = new Date().toISOString().split('T')[0]
    const userUrl = `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=daily_talisman_count,daily_talisman_date`
    const userRes = await fetch(userUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    
    let dailyTalismanCount = 0
    let dailyTalismanDate: string | null = null
    
    if (userRes.ok) {
      const rows = (await userRes.json()) as Array<{
        daily_talisman_count?: number
        daily_talisman_date?: string
      }>
      const row = rows[0]
      dailyTalismanCount = row?.daily_talisman_count ?? 0
      dailyTalismanDate = row?.daily_talisman_date ?? null
    }
    
    if (dailyTalismanDate !== today) {
      dailyTalismanCount = 0
    }
    
    await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        telegram_id: telegramUserId,
        daily_talisman_count: dailyTalismanCount + 1,
        daily_talisman_date: today,
      }),
    })
  } catch (error) {
    console.error('Error incrementing talisman count:', error)
  }
}
