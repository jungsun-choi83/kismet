import OpenAI from 'openai'
import { checkMonthlyBudget, recordUsage, calculateCost } from './lib/budgetCap'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

function sajuToText(saju: Record<string, unknown>): string {
  const fp = saju.fourPillars as Record<string, { heavenlyStem?: string; earthlyBranch?: string; element?: string }> | undefined
  const fe = saju.fiveElements as Record<string, number> | undefined
  const parts: string[] = []
  if (fp) { for (const k of ['year', 'month', 'day', 'hour']) { const p = fp[k]; if (p) parts.push(`${k}: ${p.heavenlyStem}${p.earthlyBranch} (${p.element ?? ''})`) } }
  if (fe) parts.push('Five elements: ' + JSON.stringify(fe))
  parts.push('Day Master: ' + String(saju.dayMaster ?? ''))
  return parts.join('\n')
}

export async function generatePremiumReport(sajuResult: Record<string, unknown>, telegramUserId?: number): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')
  const budgetOk = await checkMonthlyBudget()
  if (!budgetOk.allowed) throw new Error('Monthly budget limit reached.')
  const sajuText = sajuToText(sajuResult)
  const systemPrompt = `You are a master of Four Pillars of Destiny (Bazi). Write as a spiritual coach. Output well-structured HTML: <h2>, <h3>, <p>, <ul>, <strong>. No inline styles. Keep to about one A4 page (600–800 words). Write only in English.`
  const userPrompt = `Analyze this Four Pillars data:\n${sajuText}\n\nProvide: Five Elements Distribution, Core Energy, Lucky Element & Practical Guidance, Pattern Analysis, Life Areas. Output valid HTML only.`
  const res = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 2500 })
  const content = res.choices[0]?.message?.content?.trim()
  if (!content) throw new Error('Report generation failed')
  const cost = calculateCost('gpt-4o', res.usage?.prompt_tokens, res.usage?.completion_tokens)
  await recordUsage('gpt-4o', cost, telegramUserId, res.usage?.prompt_tokens, res.usage?.completion_tokens, false)
  return content
}
