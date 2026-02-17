import { init } from '@telegram-apps/sdk-react'

const win = typeof window !== 'undefined' ? window : null
export const isTelegramEnv = !!(win && (win as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp)

export function initTelegram() {
  if (isTelegramEnv) {
    init()
    const tg = (win as unknown as { Telegram?: { WebApp?: { setHeaderColor?: (color: string) => void; expand?: () => void } } }).Telegram?.WebApp
    tg?.setHeaderColor?.('#0A0A0F')
    tg?.expand?.()
  }
}
