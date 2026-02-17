/**
 * Runs only after successful_payment: generate content, store result, notify user.
 * DALL-E 3 and GPT-4o are called only here (never before payment).
 */
import type { VercelRequest, VercelResponse } from '../vercel'
import { generateTalismanImage } from '../generate-talisman/route'
import { generatePremiumReport } from '../generate-report/route'
import { generateCoupleReport } from '../generate-couple/route'
import { updatePaymentResult } from '../lib/paymentLog'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://kismet-beta.vercel.app'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

async function fetchSaju(telegramUserId: number): Promise<Record<string, unknown> | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/saju_cache?telegram_user_id=eq.${telegramUserId}&select=saju_result`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  )
  if (!res.ok) return null
  const rows = (await res.json()) as { saju_result?: unknown }[]
  const row = rows[0]
  return row?.saju_result != null ? (row.saju_result as Record<string, unknown>) : null
}

async function sendMessage(chatId: number, text: string, replyMarkup?: { inline_keyboard: unknown[] }) {
  if (!BOT_TOKEN) return
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const body: Record<string, unknown> = { chat_id: chatId, text, parse_mode: 'HTML' }
  if (replyMarkup) body.reply_markup = replyMarkup
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const body = (req.body ?? {}) as {
      telegram_user_id: number
      product: string
      telegram_payment_charge_id: string
      payload?: { wish?: string; style?: string; partnerSaju?: Record<string, unknown> }
      chat_id?: number
    }
    const { telegram_user_id, product, telegram_payment_charge_id, payload, chat_id } = body
    if (!telegram_user_id || !product || !telegram_payment_charge_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const sajuResult = await fetchSaju(telegram_user_id)

    // Helper to unlock user features
    async function unlockUserFeatures(fullReading?: boolean, talisman?: boolean) {
      if (!SUPABASE_URL || !SUPABASE_KEY) return
      try {
        const updateData: Record<string, boolean> = {}
        if (fullReading) updateData.unlocked_full_reading = true
        if (talisman) updateData.unlocked_talisman = true
        if (Object.keys(updateData).length === 0) return
        
        await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            telegram_id: telegram_user_id,
            ...updateData,
          }),
        })
      } catch (e) {
        console.error('Failed to unlock user features:', e)
      }
    }

    // New products
    if (product === 'full_reading') {
      await unlockUserFeatures(true, false)
      if (chat_id && BOT_TOKEN) {
        await sendMessage(
          chat_id,
          `📖 Your Full Reading is unlocked!\n\n<a href="${MINI_APP_URL}/result">Open app to view detailed analysis</a>`,
          { inline_keyboard: [[{ text: '📖 View Full Reading', web_app: { url: `${MINI_APP_URL}/result` } }]] }
        )
      }
      return res.status(200).json({ ok: true })
    }

    if (product === 'personal_talisman' || product === 'talisman') {
      const wish = payload?.wish ?? 'blessing'
      const style = payload?.style ?? 'traditional'
      const { imageUrl, guide } = await generateTalismanImage(sajuResult ?? {}, wish, style, telegram_user_id)
      await updatePaymentResult(telegram_payment_charge_id, { result_url: imageUrl })
      await unlockUserFeatures(false, true)
      if (chat_id && BOT_TOKEN) {
        await sendMessage(
          chat_id,
          `✨ Your talisman is ready!\n\n${guide}\n\n<a href="${MINI_APP_URL}/talisman/result?paid=1">Open app to view</a>`,
          { inline_keyboard: [[{ text: '🔮 Open Talisman', web_app: { url: `${MINI_APP_URL}/talisman/result?paid=1` } }]] }
        )
      }
      return res.status(200).json({ ok: true, result_url: imageUrl })
    }

    if (product === 'premium_bundle') {
      const wish = payload?.wish ?? 'blessing'
      const style = payload?.style ?? 'traditional'
      const { imageUrl, guide } = await generateTalismanImage(sajuResult ?? {}, wish, style, telegram_user_id)
      await updatePaymentResult(telegram_payment_charge_id, { result_url: imageUrl })
      await unlockUserFeatures(true, true)
      if (chat_id && BOT_TOKEN) {
        await sendMessage(
          chat_id,
          `✨ Premium Bundle unlocked!\n\nFull Reading + Personal Talisman\n\n<a href="${MINI_APP_URL}/result">View Full Reading</a> | <a href="${MINI_APP_URL}/talisman/result?paid=1">View Talisman</a>`,
          { inline_keyboard: [
            [{ text: '📖 Full Reading', web_app: { url: `${MINI_APP_URL}/result` } }],
            [{ text: '🔮 Talisman', web_app: { url: `${MINI_APP_URL}/talisman/result?paid=1` } }]
          ]}
        )
      }
      return res.status(200).json({ ok: true, result_url: imageUrl })
    }

    if (product === 'couple') {
      const partnerSaju = payload?.partnerSaju as Record<string, unknown> | undefined
      if (!sajuResult || !partnerSaju) {
        if (chat_id && BOT_TOKEN) {
          await sendMessage(chat_id, '⚠️ Couple analysis needs both birth charts. Please try again from the app with your partner’s data.')
        }
        return res.status(400).json({ error: 'Missing saju or partnerSaju' })
      }
      const coupleHtml = await generateCoupleReport(sajuResult, partnerSaju, telegram_user_id)
      await updatePaymentResult(telegram_payment_charge_id, { couple_report_text: coupleHtml })
      if (chat_id && BOT_TOKEN) {
        await sendMessage(
          chat_id,
          `💕 Your couple compatibility report is ready!\n\n<a href="${MINI_APP_URL}/couple/result?paid=1">Open app to read</a>`,
          { inline_keyboard: [[{ text: '💕 Open Report', web_app: { url: `${MINI_APP_URL}/couple/result?paid=1` } }]] }
        )
      }
      return res.status(200).json({ ok: true })
    }

    if (product === 'monthly_fortune') {
      const expiresAt = addDays(new Date(), 30).toISOString()
      await updatePaymentResult(telegram_payment_charge_id, { subscription_expires_at: expiresAt })
      if (chat_id && BOT_TOKEN) {
        await sendMessage(
          chat_id,
          `📅 Your 30-day Monthly Fortune access is active!\n\n<a href="${MINI_APP_URL}/monthly-fortune">Open app to read your monthly fortune</a>`,
          { inline_keyboard: [[{ text: '📅 Monthly Fortune', web_app: { url: `${MINI_APP_URL}/monthly-fortune` } }]] }
        )
      }
      return res.status(200).json({ ok: true })
    }

    if (product === 'report') {
      const reportHtml = await generatePremiumReport(sajuResult ?? {}, telegram_user_id)
      await updatePaymentResult(telegram_payment_charge_id, { report_text: reportHtml })
      if (chat_id && BOT_TOKEN) {
        await sendMessage(
          chat_id,
          `📜 Your premium Four Pillars report is ready!\n\n<a href="${MINI_APP_URL}/report/result?paid=1">Open app to read</a>`,
          { inline_keyboard: [[{ text: '📖 Open Report', web_app: { url: `${MINI_APP_URL}/report/result?paid=1` } }]] }
        )
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Unknown product' })
  } catch (e) {
    console.error('fulfill-payment', e)
    return res.status(500).json({ error: (e as Error).message })
  }
}
