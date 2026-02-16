import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

// Simplified Four Pillars calculation (skeleton - full implementation needs full manseiryek)
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const TIAN_GAN_EN = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water']
const DI_ZHI_EN = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig']
const ELEMENT_MAP: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire', '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal', '壬': 'water', '癸': 'water',
  '寅': 'wood', '卯': 'wood', '巳': 'fire', '午': 'fire', '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
  '申': 'metal', '酉': 'metal', '亥': 'water', '子': 'water'
}

function getYearPillar(year: number) {
  const idx = (year - 4) % 60
  const tg = idx % 10
  const dz = idx % 12
  return { heavenlyStem: TIAN_GAN[tg], earthlyBranch: DI_ZHI[dz], heavenlyStemEnglish: TIAN_GAN_EN[tg], earthlyBranchEnglish: DI_ZHI_EN[dz], element: ELEMENT_MAP[TIAN_GAN[tg]] }
}

function getMonthPillar(year: number, month: number) {
  const yp = (year - 4) % 60
  const tgYear = yp % 10
  const monthIdx = (month - 1 + (tgYear * 2 + 2) % 12) % 12
  const tg = (tgYear * 2 + Math.floor(monthIdx / 2)) % 10
  const dz = (monthIdx + 2) % 12
  return { heavenlyStem: TIAN_GAN[tg], earthlyBranch: DI_ZHI[dz], heavenlyStemEnglish: TIAN_GAN_EN[tg], earthlyBranchEnglish: DI_ZHI_EN[dz], element: ELEMENT_MAP[TIAN_GAN[tg]] }
}

function getDayPillar(date: Date) {
  const base = new Date(1900, 0, 1)
  const diff = Math.floor((date.getTime() - base.getTime()) / 86400000)
  const idx = diff % 60
  const tg = idx % 10
  const dz = idx % 12
  return { heavenlyStem: TIAN_GAN[tg], earthlyBranch: DI_ZHI[dz], heavenlyStemEnglish: TIAN_GAN_EN[tg], earthlyBranchEnglish: DI_ZHI_EN[dz], element: ELEMENT_MAP[TIAN_GAN[tg]] }
}

function getHourPillar(dayGan: number, hour: number, lmtOffsetMinutes = 0) {
  const adjustedHour = hour + lmtOffsetMinutes / 60
  const dz = Math.floor((adjustedHour + 1) / 2) % 12
  const tg = (dayGan * 2 + Math.floor((dz + 2) / 2)) % 10
  return { heavenlyStem: TIAN_GAN[tg], earthlyBranch: DI_ZHI[dz], heavenlyStemEnglish: TIAN_GAN_EN[tg], earthlyBranchEnglish: DI_ZHI_EN[dz], element: ELEMENT_MAP[TIAN_GAN[tg]] }
}

function computeFiveElements(pillars: { heavenlyStem: string; earthlyBranch: string }[]) {
  const counts: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  for (const p of pillars) {
    const e1 = ELEMENT_MAP[p.heavenlyStem]
    const e2 = ELEMENT_MAP[p.earthlyBranch]
    if (e1) counts[e1] = (counts[e1] ?? 0) + 1
    if (e2) counts[e2] = (counts[e2] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return {
    wood: Math.round(((counts.wood ?? 0) / total) * 100),
    fire: Math.round(((counts.fire ?? 0) / total) * 100),
    earth: Math.round(((counts.earth ?? 0) / total) * 100),
    metal: Math.round(((counts.metal ?? 0) / total) * 100),
    water: Math.round(((counts.water ?? 0) / total) * 100),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { birthDate, birthTime, gender, calendarType, birthCity, latitude, longitude, timezoneOffset, timezoneName, telegramUserId } = body

    const [y, m, d] = birthDate.split('-').map(Number)
    let hour = 12
    if (birthTime) {
      const [h, min] = birthTime.split(':').map(Number)
      hour = h + min / 60
    }
    const date = new Date(y, m - 1, d)

    const yearPillar = getYearPillar(y)
    const monthPillar = getMonthPillar(y, m)
    const dayPillar = getDayPillar(date)

    let lmtOffset = 0
    if (longitude != null && timezoneOffset != null) {
      const stdLongitude = (timezoneOffset / 60) * 15
      lmtOffset = (longitude - stdLongitude) * 4
    }

    let hourPillar = null
    if (birthTime) {
      const dayIdx = Math.floor((date.getTime() - new Date(1900, 0, 1).getTime()) / 86400000) % 60
      const dayGan = dayIdx % 10
      hourPillar = getHourPillar(dayGan, hour, lmtOffset)
    }

    const fourPillars = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar }
    const allPillars = [yearPillar, monthPillar, dayPillar, hourPillar].filter(Boolean)
    const fiveElements = computeFiveElements(allPillars)
    const dayMaster = dayPillar.heavenlyStem

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    let overallReading = 'Your destiny is written in the stars. The Four Pillars reveal a unique path shaped by the elements.'
    let categories = {
      wealth: { score: 3, text: 'Moderate fortune in wealth. Stay diligent.' },
      love: { score: 4, text: 'Good prospects in love. Be open to opportunities.' },
      career: { score: 3, text: 'Steady career growth. Patience will reward you.' },
      health: { score: 4, text: 'Generally good health. Maintain balance.' },
    }

    if (openaiKey) {
      const pillarsStr = JSON.stringify(fourPillars)
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a master of Korean Saju (Four Pillars of Destiny). Given the birth chart, provide an insightful reading in English. Be mystical yet practical. Include personality, life path, and specific fortune for wealth/love/career/health. For each category, give a score 1-5 and a short text. Respond with valid JSON: { "overallReading": string, "categories": { "wealth": { "score": number, "text": string }, "love": {...}, "career": {...}, "health": {...} }, "luckyColor": string, "luckyNumber": number }' },
            { role: 'user', content: `Four Pillars: ${pillarsStr}. Gender: ${gender}. Provide the reading.` },
          ],
        }),
      })
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content
      if (content) {
        try {
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
          if (parsed.overallReading) overallReading = parsed.overallReading
          if (parsed.categories) categories = parsed.categories
        } catch {}
      }
    }

    const sajuResult = {
      fourPillars,
      fiveElements,
      overallReading,
      categories,
      luckyColor: 'Gold',
      luckyNumber: 7,
      dayMaster,
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: existing } = await supabase.from('users').select('id').eq('telegram_id', telegramUserId).maybeSingle()
    if (existing) {
      await supabase.from('users').update({
        birth_date: birthDate,
        birth_time: birthTime || null,
        birth_city: birthCity || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        timezone_name: timezoneName ?? null,
        gender,
        calendar_type: calendarType || 'solar',
        saju_result: sajuResult,
        updated_at: new Date().toISOString(),
      }).eq('telegram_id', telegramUserId)
    } else {
      await supabase.from('users').insert({
        telegram_id: telegramUserId,
        username: body.username ?? null,
        birth_date: birthDate,
        birth_time: birthTime || null,
        birth_city: birthCity || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        timezone_name: timezoneName ?? null,
        gender,
        calendar_type: calendarType || 'solar',
        saju_result: sajuResult,
      })
    }

    return new Response(JSON.stringify(sajuResult), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
