/**
 * POST: Use 1 free talisman credit, generate talisman, send to user.
 */
import type { VercelRequest, VercelResponse } from '../vercel'
import { generateTalismanImage } from '../generate-talisman/route'

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

async function decrementCredit(telegramUserId: number): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false
  try {
    const url = `${SUPABASE_URL}/rest/v1/user_credits?telegram_user_id=eq.${telegramUserId}`
    const current = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    const rows = (await current.json()) as { free_talisman_credits: number }[]
    const currentCredits = rows[0]?.free_talisman_credits ?? 0
    if (currentCredits < 1) return false

    const update = await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        telegram_user_id: telegramUserId,
        free_talisman_credits: currentCredits - 1,
      }),
    })
    return update.ok
  } catch {
    return false
  }
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const body = (req.body ?? {}) as {
      telegram_user_id: number
      chat_id?: number
      wish?: string
      style?: string
    }
    const { telegram_user_id, chat_id, wish = 'blessing', style = 'traditional' } = body
    if (!telegram_user_id) {
      return res.status(400).json({ error: 'telegram_user_id required' })
    }

    const hasCredit = await decrementCredit(telegram_user_id)
    if (!hasCredit) {
      return res.status(400).json({ error: 'No free talisman credits available' })
    }

    const sajuResult = await fetchSaju(telegram_user_id)
    const { imageUrl, guide } = await generateTalismanImage(sajuResult ?? {}, wish, style, telegram_user_id)

    if (chat_id && BOT_TOKEN) {
      await sendMessage(
        chat_id,
        `✨ Your free talisman is ready!\n\n${guide}\n\n<a href="${MINI_APP_URL}/talisman/result?paid=1">Open app to view</a>`,
        { inline_keyboard: [[{ text: '🔮 Open Talisman', web_app: { url: `${MINI_APP_URL}/talisman/result?paid=1` } }]] }
      )
    }

    return res.status(200).json({ ok: true, result_url: imageUrl })
  } catch (e) {
    console.error('use-free-talisman', e)
    return res.status(500).json({ error: (e as Error).message })
  }
}
