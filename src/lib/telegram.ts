import { init } from '@telegram-apps/sdk-react'

const win = typeof window !== 'undefined' ? window : null
export const isTelegramEnv = !!(win && (win as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp)

export function initTelegram() {
  if (isTelegramEnv) {
    init()
    const tg = (win as unknown as { Telegram?: { WebApp?: { setHeaderColor?: (color: string) => void; expand?: () => void; version?: string; ready?: () => void } } }).Telegram?.WebApp
    tg?.setHeaderColor?.('#0A0A0F')
    tg?.expand?.()
    tg?.ready?.()
    
    // Force cache refresh on app start (for Telegram Mini App cache issues)
    const lastVersion = sessionStorage.getItem('app_version')
    const currentVersion = import.meta.env.VITE_APP_VERSION || new Date().getTime().toString()
    if (lastVersion !== currentVersion) {
      sessionStorage.setItem('app_version', currentVersion)
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)))
      }
      // Force reload if version changed (but only once per session)
      if (lastVersion && lastVersion !== currentVersion) {
        window.location.reload()
      }
    }
  }
}
