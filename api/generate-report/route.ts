/**
 * Premium report (500 Stars): GPT-4o, A4-length English,
 * Four Pillars of Destiny, Cosmic Type, detailed sections.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config()

import OpenAI from 'openai'
import { checkMonthlyBudget, recordUsage, calculateCost } from '../lib/budgetCap'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

function sajuToText(saju: Record<string, unknown>): string {
  const fp = saju.fourPillars as Record<string, { heavenlyStem?: string; earthlyBranch?: string; element?: string }> | undefined
  const fe = saju.fiveElements as Record<string, number> | undefined
  const parts: string[] = []
  if (fp) {
    for (const k of ['year', 'month', 'day', 'hour']) {
      const p = fp[k]
      if (p) parts.push(`${k}: ${p.heavenlyStem}${p.earthlyBranch} (${p.element ?? ''})`)
    }
  }
  if (fe) parts.push('Five elements: ' + JSON.stringify(fe))
  parts.push('Day Master: ' + String(saju.dayMaster ?? ''))
  return parts.join('\n')
}

export async function generatePremiumReport(
  sajuResult: Record<string, unknown>,
  telegramUserId?: number
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')

  // Check monthly budget cap
  const budgetCheck = await checkMonthlyBudget()
  if (!budgetCheck.allowed) {
    throw new Error('Monthly budget limit reached. Please try again later.')
  }

  const sajuText = sajuToText(sajuResult)

  const systemPrompt = `You are a master of Four Pillars of Destiny (Bazi), combining the principles of **Ziping Zhenzhuan (자평진전)** Pattern Theory and **Ditian Shu (적천수)** Suppression-Facilitation Theory. Write as a spiritual coach who heals the psyche and balances energy, not a fortune teller. Use clear, elegant English for a global audience. Output well-structured HTML: <h2>, <h3>, <p>, <ul>, <strong>. No inline styles. Keep to about one A4 page (roughly 600–800 words). Write only in English.`

  const userPrompt = `Analyze this Four Pillars (Bazi) data using **Ziping Zhenzhuan Pattern Theory** and **Ditian Shu Suppression-Facilitation Theory**:

${sajuText}

**Analysis Framework:**
- Base your analysis on the Eight Characters (팔자) provided above
- Apply Ziping Zhenzhuan's Pattern Theory (격국론) to identify the structural pattern
- Apply Ditian Shu's Suppression-Facilitation Theory (억부용신론) to determine the needed element (용신)

**Output Structure (in this exact order):**

1. **Five Elements Distribution** – Visual description of Wood, Fire, Earth, Metal, Water percentages. Explain which elements are strong/weak and what this means energetically.

2. **Core Energy (Day Master Essence)** – Define the Day Master's (일간) fundamental nature and inherent tendencies. This is the user's core self.

3. **Lucky Element & Practical Guidance** – Identify the **Yongsin (용신)**—the element the user needs most right now. Provide specific, actionable daily practices to invite this energy:
   - What colors, activities, foods, environments, or habits can help?
   - Be concrete and practical, not abstract.

4. **Pattern Analysis** – Based on Ziping Zhenzhuan, describe the structural pattern (격국) and its implications for life path.

5. **Life Areas** (brief, integrated):
   - **Wealth & Resources** – How element balance affects material flow
   - **Love & Relationships** – Elemental chemistry in connections
   - **Career & Purpose** – Vocational alignment with core energy
   - **Health & Vitality** – Element balance and wellness practices

**Tone:** Spiritual coaching style—healing, empowering, energy-balancing. Avoid fortune-telling predictions. Focus on understanding, healing, and practical guidance.

Output valid HTML only (no markdown).`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2500,
  })

  const content = res.choices[0]?.message?.content?.trim()
  if (!content) throw new Error('Report generation failed')

  // Record usage and cost
  const tokensInput = res.usage?.prompt_tokens
  const tokensOutput = res.usage?.completion_tokens
  const cost = calculateCost('gpt-4o', tokensInput, tokensOutput)
  await recordUsage('gpt-4o', cost, telegramUserId, tokensInput, tokensOutput, false)

  return content
}
