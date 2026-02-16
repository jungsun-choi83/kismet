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
        if (url === '/api/generate-talisman' && req.method === 'POST') {
          try {
            const raw = await readBody(req)
            const body = JSON.parse(raw)
            const { sajuResult, wish, style } = body
            const result = await generateTalismanImage(sajuResult ?? {}, wish ?? '', style ?? 'traditional')
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
        next()
      })
    },
  }
}
