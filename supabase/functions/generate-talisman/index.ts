import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

const STYLE_PROMPTS: Record<string, string> = {
  traditional: 'Traditional Korean/Chinese talisman on red hanji paper with gold brush calligraphy and traditional seal, mystical Eastern style',
  modern: 'Minimal geometric talisman design, dark navy background, gold geometric patterns, clean modern symbol',
  fantasy: 'Fantasy magical circle talisman, glowing runes, East Asian mystical elements, magical effects',
  cosmic: 'Cosmic talisman with constellation background, zodiac patterns, zen meditation atmosphere, starry sky',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { sajuResult, wish, style, telegramUserId } = body

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: recent } = await supabase.from('talismans').select('created_at').eq('telegram_id', telegramUserId).order('created_at', { ascending: false }).limit(6)
    if (recent && recent.length >= 5) {
      const newest = new Date(recent[0].created_at).getTime()
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000
      if (newest > dayAgo) {
        return new Response(JSON.stringify({ error: 'Rate limit: max 5 talismans per 24 hours' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return new Response(JSON.stringify({ error: 'OpenAI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const basePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.traditional
    const wishText = wish.replace(/([A-Z])/g, ' $1').trim()
    const elements = sajuResult?.fiveElements ? JSON.stringify(sajuResult.fiveElements) : ''
    const prompt = `Create a talisman image for the wish: ${wishText}. Style: ${basePrompt}. Personalize with these five elements balance: ${elements}. Square format, suitable for a mobile wallpaper.`

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard' }),
    })
    const imgData = await res.json()
    const imgUrl = imgData?.data?.[0]?.url
    if (!imgUrl) return new Response(JSON.stringify({ error: 'Image generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const imgRes = await fetch(imgUrl)
    const blob = await imgRes.blob()
    const buf = await blob.arrayBuffer()
    const fileName = `talismans/${telegramUserId}_${Date.now()}.png`
    const { error: uploadErr } = await supabase.storage.from('talismans').upload(fileName, buf, { contentType: 'image/png', upsert: true })
    if (uploadErr) return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: publicUrl } = supabase.storage.from('talismans').getPublicUrl(fileName)

    let guide = 'Keep this talisman as your phone wallpaper or in a visible place. Meditate on your wish while viewing it.'
    const guideRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Write a short 3-4 sentence guide on how to use a talisman for the given wish. Be practical and mystical.' },
          { role: 'user', content: `Wish: ${wishText}` },
        ],
      }),
    })
    const guideData = await guideRes.json()
    const guideContent = guideData?.choices?.[0]?.message?.content
    if (guideContent) guide = guideContent.trim()

    const { data: userRow } = await supabase.from('users').select('id').eq('telegram_id', telegramUserId).single()
    await supabase.from('talismans').insert({
      user_id: userRow?.id ?? null,
      telegram_id: telegramUserId,
      wish,
      style,
      image_url: publicUrl.publicUrl,
      guide,
    })

    return new Response(JSON.stringify({ imageUrl: publicUrl.publicUrl, guide }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
