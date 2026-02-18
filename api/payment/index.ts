/**
 * Merged API: create-invoice + check-payment (saves 1 serverless function)
 * POST ?action=create|check
 */
import type { VercelRequest, VercelResponse } from '../vercel'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const PRODUCTS: Record<string, { amount: number; title: string; description: string }> = {
  full_reading: { amount: 150, title: 'Full Fortune Reading', description: 'Unlock detailed fortune analysis for Wealth, Love, Career & Health + 2025 yearly forecast' },
  personal_talisman: { amount: 250, title: 'Personal Talisman', description: 'AI-generated talisman based on YOUR Four Pillars & Five Elements' },
  premium_bundle: { amount: 350, title: 'Premium Bundle — Reading + Talisman', description: 'Full Reading + Personal Talisman — Save 50⭐' },
  talisman: { amount: 250, title: 'Personal Talisman', description: 'AI-generated talisman based on YOUR Four Pillars & Five Elements' },
  couple: { amount: 200, title: 'KISMET Couple Compatibility', description: 'AI-driven couple compatibility analysis' },
  monthly_fortune: { amount: 300, title: 'KISMET Monthly Fortune', description: '30-day access to monthly fortune readings' },
  report: { amount: 500, title: 'KISMET Premium Deep Reading', description: 'Full-page Four Pillars report (GPT-4o)' },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const action = req.query?.action as string || (req.body as { action?: string })?.action || 'create'

  try {
    if (action === 'create') {
      if (!BOT_TOKEN) {
        return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' })
      }
      const body = (req.body ?? {}) as {
        telegramUserId?: number
        product?: string
        wish?: string
        style?: string
        partnerSaju?: Record<string, unknown>
      }
      const { telegramUserId, product = 'talisman', wish = '', style = 'traditional', partnerSaju } = body
      const prod = PRODUCTS[product] ?? PRODUCTS.talisman

      const payload = {
        telegramUserId,
        product,
        wish,
        style,
        ...(partnerSaju && { partnerSaju }),
      }

      const apiRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: prod.title,
          description: prod.description,
          payload: JSON.stringify(payload),
          provider_token: '',
          currency: 'XTR',
          prices: [{ label: prod.title, amount: prod.amount }],
        }),
      })
      const data = (await apiRes.json()) as { ok?: boolean; result?: string; description?: string }
      const invoiceLink = data?.result
      if (!invoiceLink) {
        return res.status(500).json({ error: data?.description ?? 'Failed to create invoice' })
      }
      return res.status(200).json({ invoiceLink })
    }

    if (action === 'check') {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Database not configured' })
      }
      const body = (req.body ?? {}) as {
        telegram_user_id?: number
        telegram_payment_charge_id?: string
        product?: string
      }
      const { telegram_user_id, telegram_payment_charge_id, product } = body

      if (!telegram_user_id) {
        return res.status(400).json({ error: 'Missing telegram_user_id' })
      }

      let queryUrl = `${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${telegram_user_id}`
      if (telegram_payment_charge_id) {
        queryUrl += `&telegram_payment_charge_id=eq.${telegram_payment_charge_id}`
      } else if (product) {
        queryUrl += `&product=eq.${product}`
      }
      queryUrl += `&select=status,product,telegram_user_id,created_at&order=created_at.desc&limit=1`

      const paymentRes = await fetch(queryUrl, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      })

      if (!paymentRes.ok) {
        return res.status(500).json({ error: 'Failed to check payment status' })
      }

      const payments = (await paymentRes.json()) as Array<{
        status?: string
        product?: string
        telegram_user_id?: number
        created_at?: string
      }>

      if (payments.length === 0) {
        return res.status(200).json({
          paid: false,
          status: 'pending',
          message: 'Payment processing... Please wait a moment and refresh.',
        })
      }

      const payment = payments[0]
      const paymentTime = payment.created_at ? new Date(payment.created_at).getTime() : 0
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const isRecent = paymentTime > fiveMinutesAgo
      const isPaid = payment.status === 'completed' && payment.telegram_user_id === telegram_user_id && (isRecent || telegram_payment_charge_id)

      return res.status(200).json({
        paid: isPaid,
        status: payment.status || 'unknown',
        product: payment.product,
      })
    }

    return res.status(400).json({ error: 'action must be create or check' })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
