import type { Plugin } from 'vite'
import { IncomingMessage, ServerResponse } from 'http'
import { generateTalismanImage } from './api/generate-talisman/route'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

export function apiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url?.split('?')[0]
        // Local dev: proxy to Vercel deployment (production uses api/calculate-saju, api/daily-fortune directly)
        const vercelBase = process.env.VITE_VERCEL_URL || 'https://kismet-beta.vercel.app'
        if (url === '/api/calculate-saju' && req.method === 'POST') {
          try {
            const raw = await readBody(req)
            const proxyRes = await fetch(`${vercelBase}/api/calculate-saju`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw })
            const text = await proxyRes.text()
            res.statusCode = proxyRes.status
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(text || '{}')
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: (e as Error).message }))
          }
          return
        }
        if (url === '/api/daily-fortune' && req.method === 'POST') {
          try {
            const raw = await readBody(req)
            const proxyRes = await fetch(`${vercelBase}/api/daily-fortune`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw })
            const text = await proxyRes.text()
            res.statusCode = proxyRes.status
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(text || '{}')
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: (e as Error).message }))
          }
          return
        }
        if (url === '/api/generate-talisman' && req.method === 'POST') {
          try {
            const raw = await readBody(req)
            const body = JSON.parse(raw) as {
              sajuResult?: { dayMaster?: string; fiveElements?: unknown }
              wish?: string
              style?: string
              telegramUserId?: number
            }
            const { sajuResult, wish, style, telegramUserId } = body
            const result = await generateTalismanImage(
              sajuResult ?? {},
              wish ?? '',
              style ?? 'traditional',
              telegramUserId
            )
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify(result))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: (e as Error).message }))
          }
          return
        }
        if (url === '/api/create-invoice' && req.method === 'POST') {
          try {
            const raw = await readBody(req)
            const body = JSON.parse(raw) as { telegramUserId?: number; product?: string; wish?: string; style?: string }
            const { telegramUserId, product = 'talisman', wish = '', style = 'traditional' } = body
            const botToken = process.env.TELEGRAM_BOT_TOKEN
            if (!botToken) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not set' }))
              return
            }
            const title = `KISMET Talisman - ${wish} (${style})`
            const description = `Personalized talisman for ${wish}`
            const apiRes = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                description,
                payload: JSON.stringify({ telegramUserId, wish, style, product }),
                provider_token: '',
                currency: 'XTR',
                prices: [{ label: 'Talisman', amount: 50 }],
              }),
            })
            const data = (await apiRes.json()) as { ok?: boolean; result?: string; description?: string }
            const invoiceLink = data?.result
            if (!invoiceLink) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: data?.description ?? 'Failed to create invoice' }))
              return
            }
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify({ invoiceLink }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: (e as Error).message }))
          }
          return
        }
        if (url === '/api/save-saju' && req.method === 'POST') {
          try {
            const raw = await readBody(req)
            const body = JSON.parse(raw) as { telegram_user_id?: number; saju_result?: unknown }
            if (!body.telegram_user_id || !body.saju_result) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'telegram_user_id and saju_result required' }))
              return
            }
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: (e as Error).message }))
          }
          return
        }
        if (url?.startsWith('/api/data') && req.method === 'GET') {
          try {
            const vercelBase = process.env.VITE_VERCEL_URL || 'https://kismet-beta.vercel.app'
            const proxyRes = await fetch(`${vercelBase}${url}`)
            const text = await proxyRes.text()
            res.statusCode = proxyRes.status
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(text || '{}')
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: (e as Error).message }))
          }
          return
        }
        next()
      })
    },
  }
}
