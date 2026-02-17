/**
 * Check payment status by polling database
 * Used when openInvoice callback returns 'paid' but webhook hasn't arrived yet
 */
import type { VercelRequest, VercelResponse } from '../vercel'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = (req.body ?? {}) as {
      telegram_user_id?: number
      telegram_payment_charge_id?: string
      product?: string
    }
    const { telegram_user_id, telegram_payment_charge_id, product } = body

    if (!telegram_user_id) {
      return res.status(400).json({ error: 'Missing telegram_user_id' })
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Database not configured' })
    }

    // Build query: by charge_id if available, otherwise by user_id + product + recent timestamp
    let queryUrl = `${SUPABASE_URL}/rest/v1/payments?telegram_user_id=eq.${telegram_user_id}`
    
    if (telegram_payment_charge_id) {
      queryUrl += `&telegram_payment_charge_id=eq.${telegram_payment_charge_id}`
    } else if (product) {
      queryUrl += `&product=eq.${product}`
    }
    
    queryUrl += `&select=status,product,telegram_user_id,created_at&order=created_at.desc&limit=1`

    // Check payment status in database
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
      // Payment not found yet - webhook might not have arrived
      return res.status(200).json({ 
        paid: false, 
        status: 'pending',
        message: 'Payment processing... Please wait a moment and refresh.' 
      })
    }

    const payment = payments[0]
    
    // Check if payment was created recently (within last 5 minutes) to avoid false positives
    const paymentTime = payment.created_at ? new Date(payment.created_at).getTime() : 0
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const isRecent = paymentTime > fiveMinutesAgo
    
    const isPaid = payment.status === 'completed' && 
                   payment.telegram_user_id === telegram_user_id &&
                   (isRecent || telegram_payment_charge_id) // Only trust recent payments or exact charge_id match

    return res.status(200).json({
      paid: isPaid,
      status: payment.status || 'unknown',
      product: payment.product,
    })
  } catch (e) {
    console.error('check-payment error:', e)
    return res.status(500).json({ error: (e as Error).message })
  }
}
