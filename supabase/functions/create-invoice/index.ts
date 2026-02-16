const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { telegramUserId, product, wish, style } = body
    const botToken = Deno.env.get('BOT_TOKEN')
    if (!botToken) return new Response(JSON.stringify({ error: 'Bot not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const title = `KISMET Talisman - ${wish} (${style})`
    const description = `Personalized talisman for ${wish}`

    const res = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        payload: JSON.stringify({ telegramUserId, wish, style, product }),
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: 'Talisman', amount: 50 }],
      }),
    })
    const data = await res.json()
    const invoiceLink = data?.result
    if (!invoiceLink) return new Response(JSON.stringify({ error: data?.description ?? 'Failed to create invoice' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    return new Response(JSON.stringify({ invoiceLink }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
