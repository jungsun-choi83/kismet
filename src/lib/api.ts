import type { UserInput } from '@/types'

// Supabase Edge Function 대신 Vercel API 사용
// Edge Function 에러 방지를 위해 fetch로 직접 호출

export async function callCalculateSaju(
  userInput: Partial<UserInput> & { telegramUserId: number }
): Promise<unknown> {
  // Vercel API 프록시 사용 (브라우저 → Vercel → Supabase Edge Function)
  // CORS/네트워크 제한 우회
  try {
    const res = await fetch('/api/calculate-saju', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userInput),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error ?? `API error ${res.status}`)
    }
    return res.json()
  } catch (e) {
    const error = e as Error
    throw new Error(`Failed to calculate Saju: ${error.message}`)
  }
}

export async function callGenerateTalisman(
  sajuResult: unknown,
  wish: string,
  style: string,
  telegramUserId: number
): Promise<{ imageUrl: string; guide: string }> {
  // Vercel API 사용 (이미 존재함)
  const res = await fetch('/api/generate-talisman', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sajuResult, wish, style, telegramUserId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `API error ${res.status}`)
  }
  return res.json()
}

export async function callDailyFortune(
  dayMaster: string,
  fiveElements: unknown,
  date: string,
  telegramUserId: number
): Promise<unknown> {
  // Vercel API 프록시 사용 (브라우저 → Vercel → Supabase Edge Function)
  try {
    const res = await fetch('/api/daily-fortune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayMaster, fiveElements, date, telegramUserId }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error ?? `API error ${res.status}`)
    }
    return res.json()
  } catch (e) {
    const error = e as Error
    throw new Error(`Failed to get daily fortune: ${error.message}`)
  }
}

// 이 함수는 사용되지 않음 - Talisman.tsx에서 직접 /api/create-invoice 사용
export async function callCreateInvoice(
  telegramUserId: number,
  product: string,
  wish: string,
  style: string
): Promise<{ invoiceLink: string }> {
  const res = await fetch('/api/create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramUserId, product: product || 'talisman', wish, style }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `API error ${res.status}`)
  }
  return res.json()
}
