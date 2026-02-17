import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const update = await req.json()
    const msg = update.message
    const cb = update.callback_query
    const preCheckout = update.pre_checkout_query
    const successfulPayment = update.message?.successful_payment

    if (preCheckout) {
      const botToken = Deno.env.get('BOT_TOKEN')
      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pre_checkout_query_id: preCheckout.id, ok: true }),
      })
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (successfulPayment) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Parse payload (JSON string)
      let payload: Record<string, unknown> = {}
      try {
        payload = typeof successfulPayment.invoice_payload === 'string' 
          ? JSON.parse(successfulPayment.invoice_payload) 
          : (successfulPayment.invoice_payload as Record<string, unknown> || {})
      } catch {
        // If payload is not JSON, treat as product name
        payload = { product: successfulPayment.invoice_payload || 'talisman' }
      }
      
      const product = (payload.product as string) || successfulPayment.invoice_payload || 'talisman'
      const telegramUserId = msg.from.id
      const chargeId = successfulPayment.telegram_payment_charge_id
      
      // Insert payment record first
      await supabase.from('payments').insert({
        telegram_payment_charge_id: chargeId,
        telegram_user_id: telegramUserId,
        telegram_id: telegramUserId, // Legacy field
        product,
        amount_stars: successfulPayment.total_amount || 0,
        stars_paid: successfulPayment.total_amount || 0, // Legacy field
        payload: successfulPayment,
        status: 'completed',
      }).catch((e) => {
        console.error('Failed to insert payment:', e)
        // Continue even if insert fails (might be duplicate)
      })
      
      // Call fulfill-payment API to generate content and unlock features
      const fulfillUrl = Deno.env.get('FULFILL_PAYMENT_URL') || 'https://kismet-beta.vercel.app/api/fulfill-payment'
      try {
        await fetch(fulfillUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_user_id: telegramUserId,
            product,
            telegram_payment_charge_id: chargeId,
            payload: {
              wish: payload.wish as string,
              style: payload.style as string,
              partnerSaju: payload.partnerSaju as Record<string, unknown>,
            },
            chat_id: msg.chat?.id,
          }),
        }).catch((e) => {
          console.error('Failed to call fulfill-payment:', e)
          // Don't fail webhook if fulfill-payment fails (can retry later)
        })
      } catch (e) {
        console.error('Error calling fulfill-payment:', e)
      }
      
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const botToken = Deno.env.get('BOT_TOKEN')
    const chatId = msg?.chat?.id ?? cb?.message?.chat?.id

    if (msg?.text === '/start') {
      const appUrl = Deno.env.get('MINI_APP_URL') ?? 'https://your-vercel-url.vercel.app'
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🔮 Welcome to KISMET! Discover your destiny based on ancient Eastern wisdom.',
          reply_markup: {
            inline_keyboard: [[{ text: 'Open KISMET', web_app: { url: appUrl } }]],
          },
        }),
      })
    }

    if (msg?.text === '/fortune') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      const today = new Date().toISOString().split('T')[0]
      const { data: user } = await supabase.from('users').select('saju_result').eq('telegram_id', msg.from.id).single()
      const fortune = user?.saju_result ? 'Your destiny awaits! Open the app for your full reading.' : 'Complete your profile in KISMET to get your daily fortune!'
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: fortune }),
      })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
