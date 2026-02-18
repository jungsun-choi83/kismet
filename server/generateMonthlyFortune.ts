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

export async function generateMonthlyFortune(sajuResult: Record<string, unknown>, month: number, year: number, telegramUserId?: number): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')
  const budgetOk = await checkMonthlyBudget()
  if (!budgetOk.allowed) throw new Error('Monthly budget limit reached.')
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthName = monthNames[month - 1] || 'this month'
  const sajuText = sajuToText(sajuResult)
  const systemPrompt = `You are a master of Four Pillars of Destiny (Bazi). Write as a spiritual coach. Output well-structured HTML: <h2>, <h3>, <p>, <ul>, <strong>. No inline styles. Keep to about one page (500–700 words). Write only in English.`
  const userPrompt = `Generate monthly fortune for ${monthName} ${year}:\n${sajuText}\n\nProvide: Monthly Energy Overview, Five Elements This Month, Key Areas, Favorable Days, Practical Guidance. Output valid HTML only.`
  const res = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 2000 })
  const content = res.choices[0]?.message?.content?.trim()
  if (!content) throw new Error('Monthly fortune generation failed')
  const cost = calculateCost('gpt-4o', res.usage?.prompt_tokens, res.usage?.completion_tokens)
  await recordUsage('gpt-4o', cost, telegramUserId, res.usage?.prompt_tokens, res.usage?.completion_tokens, false)
  return content
}
