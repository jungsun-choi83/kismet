/**
 * API Route: /api/generate-talisman
 * 사주 오행(Five Elements)을 받아 OpenAI DALL-E 3로 동양적 부적 이미지를 생성합니다.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config()

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function generateTalismanImage(
  sajuResult: { dayMaster?: string; fiveElements?: unknown },
  wish: string,
  style: string
): Promise<{ imageUrl: string; guide: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.')
  }

  const dayMaster = sajuResult?.dayMaster ?? ''
  let elements = ''
  if (sajuResult?.fiveElements && typeof sajuResult.fiveElements === 'object') {
    elements = Object.entries(sajuResult.fiveElements as Record<string, number>)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(', ')
  }

  const wishText = wish.replace(/([A-Z])/g, ' $1').trim().toLowerCase()

  // 고급스러운 금색 선으로 된 동양적 부적 이미지
  const prompt = `고급스러운 금색 선으로 된 동양적 부적 이미지. A luxurious oriental talisman with elegant gold lines on dark premium paper. Wish: ${wishText}. Style: ${style}.
사주 일간(Day Master): ${dayMaster}. 오행 밸런스(Five Elements): ${elements || 'balanced'}.
미니멀하고 신비로운 한국/중국 풍 부적. 4K 고품질, 정사각형. 이미지에 글자 없음.`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  })

  const imageUrl = response.data[0]?.url
  if (!imageUrl) throw new Error('이미지 생성에 실패했습니다.')

  const guideRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Write a short 3-4 sentence guide on how to use a talisman for the given wish. Be practical and mystical. Write in English.',
      },
      { role: 'user', content: `Wish: ${wishText}` },
    ],
  })

  const guide =
    guideRes.choices[0]?.message?.content?.trim() ??
    'Keep this talisman visible. Meditate on your wish while viewing it to amplify its energy.'

  return { imageUrl, guide }
}
