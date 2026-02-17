/**
 * Vercel: Telegram Stars invoice link (createInvoiceLink).
 * Products: A 100★ Talisman, B 200★ Couple, C 300★ Monthly Fortune (30-day), D 500★ Premium Report.
 */
import type { VercelRequest, VercelResponse } from '../vercel'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

const PRODUCTS: Record<string, { amount: number; title: string; description: string }> = {
  full_reading: { amount: 150, title: 'Full Fortune Reading', description: 'Unlock detailed fortune analysis for Wealth, Love, Career & Health + 2025 yearly forecast' },
  personal_talisman: { amount: 250, title: 'Personal Talisman', description: 'AI-generated talisman based on YOUR Four Pillars & Five Elements' },
  premium_bundle: { amount: 350, title: 'Premium Bundle — Reading + Talisman', description: 'Full Reading + Personal Talisman — Save 50⭐' },
  // Legacy products (keep for backward compatibility)
  talisman: { amount: 250, title: 'Personal Talisman', description: 'AI-generated talisman based on YOUR Four Pillars & Five Elements' },
  couple: { amount: 200, title: 'KISMET Couple Compatibility', description: 'AI-driven couple compatibility analysis' },
  monthly_fortune: { amount: 300, title: 'KISMET Monthly Fortune', description: '30-day access to monthly fortune readings' },
  report: { amount: 500, title: 'KISMET Premium Deep Reading', description: 'Full-page Four Pillars report (GPT-4o)' },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' })
  }

  try {
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

    // CRITICAL: Telegram Stars payment requirements
    // - currency MUST be "XTR" (Telegram Stars currency code)
    // - provider_token MUST be empty string "" (Stars doesn't use external providers)
    const apiRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: prod.title,
        description: prod.description,
        payload: JSON.stringify(payload), // Store product info in payload
        provider_token: '', // REQUIRED: Empty string for Telegram Stars
        currency: 'XTR', // REQUIRED: Telegram Stars currency code
        prices: [{ label: prod.title, amount: prod.amount }],
      }),
    })
    const data = (await apiRes.json()) as { ok?: boolean; result?: string; description?: string }
    const invoiceLink = data?.result
    if (!invoiceLink) {
      return res.status(500).json({ error: data?.description ?? 'Failed to create invoice' })
    }
    return res.status(200).json({ invoiceLink })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
