/**
 * Monthly fortune generation (GPT-4o): English, mystical + modern psychology.
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

export async function generateMonthlyFortune(
  sajuResult: Record<string, unknown>,
  month: number,
  year: number,
  telegramUserId?: number
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')

  // Check monthly budget cap
  const budgetCheck = await checkMonthlyBudget()
  if (!budgetCheck.allowed) {
    throw new Error('Monthly budget limit reached. Please try again later.')
  }

  const sajuText = sajuToText(sajuResult)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthName = monthNames[month - 1] || 'this month'

  const systemPrompt = `You are a master of Four Pillars of Destiny (Bazi), combining **Ziping Zhenzhuan Pattern Theory** and **Ditian Shu Suppression-Facilitation Theory**. Write as a spiritual coach who guides monthly energy flow. Use clear, elegant English for a global audience. Output well-structured HTML: <h2>, <h3>, <p>, <ul>, <strong>. No inline styles. Keep to about one page (500–700 words). Write only in English.`

  const userPrompt = `Generate a monthly fortune reading for ${monthName} ${year} based on this person's Four Pillars (Bazi), using **Ziping Zhenzhuan Pattern Theory** and **Ditian Shu Suppression-Facilitation Theory**:

${sajuText}

**Analysis Framework:**
- Consider the person's pattern (격국) and needed element (용신)
- Analyze how the month's energy interacts with their core energy
- Provide energy-balancing guidance, not predictions

**Output Structure:**

1. **Monthly Energy Overview** – How the cosmic energy of ${monthName} ${year} interacts with the person's Four Pillars. Visual description of element flow (2–3 sentences).

2. **Five Elements This Month** – Which elements are strengthened or weakened this month, and what this means for the person's energy balance.

3. **Key Areas** (integrated with element analysis):
   - **Wealth & Resources** – Element flow affecting material energy
   - **Love & Relationships** – Elemental chemistry in connections
   - **Career & Purpose** – Vocational energy alignment
   - **Health & Vitality** – Element balance and wellness practices

4. **Favorable Days** – Suggest 3–5 days this month when their 용신 (needed element) is strongest, with brief explanation of why.

5. **Practical Guidance** – Specific, actionable practices for this month:
   - What colors, activities, foods, environments, or habits can help balance energy?
   - How to invite their 용신 element into daily life this month?

**Tone:** Spiritual coaching style—healing, empowering, energy-balancing. Avoid fortune-telling predictions. Focus on understanding energy flow and practical guidance.

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
  if (!content) throw new Error('Monthly fortune generation failed')

  // Record usage and cost
  const tokensInput = res.usage?.prompt_tokens
  const tokensOutput = res.usage?.completion_tokens
  const cost = calculateCost('gpt-4o', tokensInput, tokensOutput)
  await recordUsage('gpt-4o', cost, telegramUserId, tokensInput, tokensOutput, false)

  return content
}
