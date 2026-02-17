import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkDailyUsageLimit, incrementDailyUsage } from '../_shared/usageLimit.ts'
import { checkMonthlyBudget, recordUsage, calculateCost } from '../_shared/budgetCap.ts'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { dayMaster, fiveElements, date, telegramUserId } = body

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const summary = 'A balanced day ahead. Trust your intuition.'
    let score = 70
    const wealth = 3
    const love = 4
    const career = 3
    const health = 4

    if (openaiKey && telegramUserId) {
      // Check monthly budget cap first
      const budgetCheck = await checkMonthlyBudget()
      if (!budgetCheck.allowed) {
        return new Response(JSON.stringify({
          score: 0,
          summary: 'Monthly budget limit reached. Please try again later.',
          wealth: 0,
          love: 0,
          career: 0,
          health: 0,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Check daily usage limit for free users
      const usageCheck = await checkDailyUsageLimit(telegramUserId)
      if (!usageCheck.allowed) {
        return new Response(JSON.stringify({
          score: 0,
          summary: usageCheck.message || "You've reached your daily free limit. Come back tomorrow or unlock premium!",
          wealth: 0,
          love: 0,
          career: 0,
          health: 0,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Proceed with AI call
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You provide daily fortune readings based on Four Pillars. Respond with JSON only: { "score": number 0-100, "summary": "2-3 sentence daily fortune", "wealth": 1-5, "love": 1-5, "career": 1-5, "health": 1-5 }' },
            { role: 'user', content: `Day master: ${dayMaster}. Five elements: ${JSON.stringify(fiveElements)}. Date: ${date}. Give today fortune.` },
          ],
        }),
      })
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content
      if (content) {
        try {
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
          
          // Record usage and cost
          const tokensInput = data?.usage?.prompt_tokens
          const tokensOutput = data?.usage?.completion_tokens
          const cost = calculateCost('gpt-4o-mini', tokensInput, tokensOutput)
          await recordUsage('gpt-4o-mini', cost, telegramUserId, tokensInput, tokensOutput, true)
          await incrementDailyUsage(telegramUserId)

          return new Response(JSON.stringify({
            score: parsed.score ?? score,
            summary: parsed.summary ?? summary,
            wealth: parsed.wealth ?? wealth,
            love: parsed.love ?? love,
            career: parsed.career ?? career,
            health: parsed.health ?? health,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch {}
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: userRow } = await supabase.from('users').select('id').eq('telegram_id', telegramUserId).single()
    if (userRow) {
      await supabase.from('daily_fortunes').upsert({
        user_id: userRow.id,
        date,
        fortune: { score, summary, wealth, love, career, health },
      }, { onConflict: 'user_id,date' })
    }

    return new Response(JSON.stringify({ score, summary, wealth, love, career, health }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
