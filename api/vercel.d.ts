/** Minimal types for Vercel serverless (avoids @vercel/node at build time) */
export interface VercelRequest {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
}
export interface VercelResponse {
  setHeader(name: string, value: string): this
  status(code: number): this
  end(): this
  json(body: unknown): this
}
