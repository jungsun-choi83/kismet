/**
 * Save user's Saju result so we can generate talisman/report after payment (server-side).
 */
import type { VercelRequest, VercelResponse } from '../vercel'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    return res.status(200).json({ ok: true })
  }

  try {
    const body = (req.body ?? {}) as { telegram_user_id?: number; saju_result?: unknown }
    const { telegram_user_id, saju_result } = body
    if (!telegram_user_id || !saju_result) {
      return res.status(400).json({ error: 'telegram_user_id and saju_result required' })
    }

    const upsertRes = await fetch(`${url}/rest/v1/saju_cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        telegram_user_id,
        saju_result,
        updated_at: new Date().toISOString(),
      }),
    })
    if (!upsertRes.ok) {
      const t = await upsertRes.text()
      return res.status(500).json({ error: t })
    }

    // Reward referrer if this referee completed their first Saju
    try {
      const referralsRes = await fetch(
        `${url}/rest/v1/referrals?referee_telegram_id=eq.${telegram_user_id}&rewarded_at=is.null&select=referrer_telegram_id`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      )
      if (referralsRes.ok) {
        const referrals = (await referralsRes.json()) as { referrer_telegram_id: number }[]
        for (const ref of referrals) {
          const referrerId = ref.referrer_telegram_id
          // Get current credits
          const creditsRes = await fetch(
            `${url}/rest/v1/user_credits?telegram_user_id=eq.${referrerId}&select=free_talisman_credits`,
            { headers: { apikey: key, Authorization: `Bearer ${key}` } }
          )
          const creditsRows = creditsRes.ok ? ((await creditsRes.json()) as { free_talisman_credits: number }[]) : []
          const currentCredits = creditsRows[0]?.free_talisman_credits ?? 0

          // Increment referrer's credits
          await fetch(`${url}/rest/v1/user_credits`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: key,
              Authorization: `Bearer ${key}`,
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
              telegram_user_id: referrerId,
              free_talisman_credits: currentCredits + 1,
            }),
          })

          // Mark referral as rewarded
          await fetch(
            `${url}/rest/v1/referrals?referee_telegram_id=eq.${telegram_user_id}&referrer_telegram_id=eq.${referrerId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: key,
                Authorization: `Bearer ${key}`,
              },
              body: JSON.stringify({ rewarded_at: new Date().toISOString() }),
            }
          )
        }
      }
    } catch {
      // ignore referral reward errors
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
