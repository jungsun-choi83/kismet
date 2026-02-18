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
    const urlParams = new URLSearchParams(window.location.search)
    const urlVersion = urlParams.get('v')
    const lastVersion = sessionStorage.getItem('app_version')
    const currentVersion = urlVersion || import.meta.env.VITE_APP_VERSION || '2'
    
    // Clear all caches on every load to force fresh content
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)))
    }
    
    // If URL has version param and it's different, reload
    if (urlVersion && lastVersion && urlVersion !== lastVersion) {
      sessionStorage.setItem('app_version', urlVersion)
      window.location.reload()
      return
    }
    
    // Set version if not set
    if (!lastVersion) {
      sessionStorage.setItem('app_version', currentVersion)
    }
  }
}
