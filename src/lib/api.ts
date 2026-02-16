import { supabase } from './supabase'
import type { UserInput } from '@/types'

export async function callCalculateSaju(
  userInput: Partial<UserInput> & { telegramUserId: number }
): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('calculate-saju', {
    body: userInput,
  })
  if (error) throw error
  return data
}

export async function callGenerateTalisman(
  sajuResult: unknown,
  wish: string,
  style: string,
  telegramUserId: number
): Promise<{ imageUrl: string; guide: string }> {
  const { data, error } = await supabase.functions.invoke('generate-talisman', {
    body: { sajuResult, wish, style, telegramUserId },
  })
  if (error) throw error
  return data
}

export async function callDailyFortune(
  dayMaster: string,
  fiveElements: unknown,
  date: string,
  telegramUserId: number
): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('daily-fortune', {
    body: { dayMaster, fiveElements, date, telegramUserId },
  })
  if (error) throw error
  return data
}

export async function callCreateInvoice(
  telegramUserId: number,
  product: string,
  wish: string,
  style: string
): Promise<{ invoiceLink: string }> {
  const { data, error } = await supabase.functions.invoke('create-invoice', {
    body: { telegramUserId, product: product || 'talisman', wish, style },
  })
  if (error) throw error
  return data
}
