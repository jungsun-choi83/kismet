/**
 * Couple compatibility report (200 Stars): GPT-4o, English,
 * Four Pillars of Destiny + modern psychology, elegant tone.
 */
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

export async function generateCoupleReport(
  sajuA: Record<string, unknown>,
  sajuB: Record<string, unknown>,
  telegramUserId?: number
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')

  // Check monthly budget cap
  const budgetCheck = await checkMonthlyBudget()
  if (!budgetCheck.allowed) {
    throw new Error('Monthly budget limit reached. Please try again later.')
  }

  const textA = sajuToText(sajuA)
  const textB = sajuToText(sajuB)

  const systemPrompt = `You are a master of Four Pillars of Destiny (Bazi) and relationship psychology, combining **Ziping Zhenzhuan Pattern Theory** and **Ditian Shu Suppression-Facilitation Theory**. Write as a spiritual coach who heals relationships and balances energy. Use clear, elegant English for a global audience. Output well-structured HTML: <h2>, <h3>, <p>, <ul>, <strong>. No inline styles. Keep to about one page (500–700 words). Write only in English.`

  const userPrompt = `Analyze couple compatibility using **Ziping Zhenzhuan Pattern Theory** and **Ditian Shu Suppression-Facilitation Theory**:

Person A:
${textA}

Person B:
${textB}

**Analysis Framework:**
- Analyze each person's pattern (격국) and needed element (용신)
- Compare their elemental chemistry
- Identify how they can support each other's energy needs

**Output Structure:**

1. **Elemental Chemistry** – Visual description of how their Five Elements interact. Which elements complement, which create tension, and what this means energetically.

2. **Core Energies Together** – Define each person's Day Master essence and how they combine as a pair (e.g. "Wood & Water Harmony"). 2–3 sentences on their combined nature.

3. **Pattern Synergy** – Based on their individual patterns (격국), how do their life paths align or complement?

4. **Mutual Support** – Where they naturally support each other's energy needs. How can Person A help Person B's 용신, and vice versa?

5. **Challenges & Navigation** – Elemental friction points and practical ways to navigate them through energy-balancing practices.

6. **Practical Guidance** – Specific, actionable advice for the relationship. What colors, activities, environments, or communication styles can help balance their combined energy?

**Tone:** Spiritual coaching style—healing, empowering, relationship-balancing. Focus on understanding, healing, and practical guidance.

Output valid HTML only (no markdown).`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
  })

  const content = res.choices[0]?.message?.content?.trim()
  if (!content) throw new Error('Couple report generation failed')

  // Record usage and cost
  const tokensInput = res.usage?.prompt_tokens
  const tokensOutput = res.usage?.completion_tokens
  const cost = calculateCost('gpt-4o', tokensInput, tokensOutput)
  await recordUsage('gpt-4o', cost, telegramUserId, tokensInput, tokensOutput, false)

  return content
}
