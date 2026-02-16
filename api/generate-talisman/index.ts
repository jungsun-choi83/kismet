/**
 * Vercel Serverless Function: /api/generate-talisman
 * POST 요청으로 사주 데이터를 받아 AI 부적 이미지를 생성합니다.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateTalismanImage } from './route'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sajuResult, wish, style } = req.body ?? {}
    const result = await generateTalismanImage(
      sajuResult ?? {},
      wish ?? '',
      style ?? 'traditional'
    )
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
}
