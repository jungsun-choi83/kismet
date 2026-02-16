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
      await supabase.from('payments').insert({
        telegram_payment_charge_id: successfulPayment.telegram_payment_charge_id,
        telegram_id: msg.from.id,
        product: successfulPayment.invoice_payload || 'talisman',
        stars_paid: successfulPayment.total_amount || 50,
        payload: successfulPayment,
        status: 'completed',
      })
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
