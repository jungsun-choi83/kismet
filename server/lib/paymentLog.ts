/**
 * Payment logging - in server/lib to avoid Vercel function count
 */
export interface PaymentRecord {
  telegram_user_id: number
  product: string
  amount_stars: number
  telegram_payment_charge_id: string
  payload?: Record<string, unknown>
  result_url?: string
  report_text?: string
  couple_report_text?: string
  subscription_expires_at?: string
}

export async function logPayment(record: PaymentRecord): Promise<void> {
  const ts = new Date().toISOString()
  console.log(JSON.stringify({ type: 'PAYMENT', at: ts, ...record }))
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return
  try {
    const res = await fetch(`${url}/rest/v1/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' },
      body: JSON.stringify({
        telegram_user_id: record.telegram_user_id,
        product: record.product,
        amount_stars: record.amount_stars,
        telegram_payment_charge_id: record.telegram_payment_charge_id,
        payload: record.payload ?? null,
        result_url: record.result_url ?? null,
        report_text: record.report_text ?? null,
        couple_report_text: record.couple_report_text ?? null,
        subscription_expires_at: record.subscription_expires_at ?? null,
      }),
    })
    if (!res.ok) console.error('Payment log insert failed', res.status, await res.text())
  } catch (e) { console.error('Payment log insert error', e) }
}

export async function updatePaymentResult(
  telegramPaymentChargeId: string,
  updates: { result_url?: string; report_text?: string; couple_report_text?: string; subscription_expires_at?: string }
): Promise<void> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return
  try {
    const res = await fetch(`${url}/rest/v1/payments?telegram_payment_charge_id=eq.${encodeURIComponent(telegramPaymentChargeId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify(updates),
    })
    if (!res.ok) console.error('Payment update failed', res.status, await res.text())
  } catch (e) { console.error('Payment update error', e) }
}
