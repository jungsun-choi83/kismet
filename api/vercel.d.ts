/** Minimal types for Vercel serverless (avoids @vercel/node at build time) */
export interface VercelRequest {
  method?: string
  body?: unknown
}
export interface VercelResponse {
  setHeader(name: string, value: string): this
  status(code: number): this
  end(): this
  json(body: unknown): this
}
