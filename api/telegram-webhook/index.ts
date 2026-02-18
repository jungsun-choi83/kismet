/**
 * Telegram Bot Webhook: /start, pre_checkout_query, successful_payment.
 * Payment is logged (who, when, how many Stars) then fulfillment runs only after success.
 */
import type { VercelRequest, VercelResponse } from '../vercel'
import { logPayment } from '../../server/lib/paymentLog'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://kismet-beta.vercel.app'
const FULFILL_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/fulfill-payment`
  : process.env.FULFILL_PAYMENT_URL || `${process.env.MINI_APP_URL || 'https://kismet-beta.vercel.app'}/api/fulfill-payment`

async function sendMessage(chatId: number, text: string, replyMarkup?: { inline_keyboard: unknown[] }) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  }
  if (replyMarkup) body.reply_markup = replyMarkup
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Telegram API ${res.status}`)
}

async function answerPreCheckout(preCheckoutQueryId: string, ok: boolean, errorMessage?: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pre_checkout_query_id: preCheckoutQueryId,
      ok,
      error_message: errorMessage,
    }),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' })
  }

  try {
    const body = req.body as {
      message?: {
        chat?: { id: number }
        text?: string
        successful_payment?: {
          telegram_payment_charge_id: string
          total_amount: number
          invoice_payload?: string
        }
      }
      pre_checkout_query?: {
        id: string
        from?: { id?: number }
        total_amount?: number
        invoice_payload?: string
      }
      edited_message?: { chat?: { id: number }; text?: string; successful_payment?: { telegram_payment_charge_id: string; total_amount: number; invoice_payload?: string } }
    }

    const preCheckout = body.pre_checkout_query
    if (preCheckout) {
      await answerPreCheckout(preCheckout.id, true)
      return res.status(200).json({ ok: true })
    }

    const message = body.message ?? body.edited_message
    const chatId = message?.chat?.id
    const text = message?.text?.trim()
    const successfulPayment = message?.successful_payment

    if (successfulPayment) {
      const chargeId = successfulPayment.telegram_payment_charge_id
      const amountStars = successfulPayment.total_amount
      let payload: { telegramUserId?: number; product?: string; wish?: string; style?: string } = {}
      try {
        payload = JSON.parse(successfulPayment.invoice_payload || '{}') as typeof payload
      } catch {
        // ignore
      }
      const telegramUserId = payload.telegramUserId ?? (message as { from?: { id?: number } }).from?.id
      const product = payload.product ?? 'talisman'

      await logPayment({
        telegram_user_id: telegramUserId ?? 0,
        product,
        amount_stars: amountStars,
        telegram_payment_charge_id: chargeId,
        payload: payload as Record<string, unknown>,
      })

      if (telegramUserId && chatId) {
        fetch(FULFILL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_user_id: telegramUserId,
            product,
            telegram_payment_charge_id: chargeId,
            payload: { wish: payload.wish, style: payload.style },
            chat_id: chatId,
          }),
        }).catch((e) => console.error('fulfill-payment trigger', e))
      }

      return res.status(200).json({ ok: true })
    }

    if (!chatId) {
      return res.status(200).json({ ok: true })
    }

    if (text?.startsWith('/start')) {
      const parts = text.split(' ')
      const startParam = parts[1]
      const referrerMatch = startParam?.match(/^ref_(\d+)$/)
      const referrerId = referrerMatch ? parseInt(referrerMatch[1], 10) : null
      const fromId = (message as { from?: { id?: number } }).from?.id

      if (referrerId && fromId && referrerId !== fromId) {
        const SUPABASE_URL = process.env.SUPABASE_URL
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (SUPABASE_URL && SUPABASE_KEY) {
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/referrals`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                Prefer: 'return=minimal',
              },
              body: JSON.stringify({
                referee_telegram_id: fromId,
                referrer_telegram_id: referrerId,
              }),
            }).catch(() => {})
          } catch {
            // ignore referral save errors
          }
        }
      }

      const welcomeText =
        '🔮 Welcome to KISMET!\n\nDiscover your cosmic destiny through the ancient wisdom of Four Pillars of Destiny (Bazi). Get personalized talismans, compatibility readings, and deep insights into your life path.\n\nOpen the app to begin your journey.'
      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '✨ Open App',
              web_app: { url: MINI_APP_URL },
            },
          ],
        ],
      }
      await sendMessage(chatId, welcomeText, replyMarkup)
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('telegram-webhook', e)
    return res.status(500).json({ error: (e as Error).message })
  }
}
