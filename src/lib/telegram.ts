import { init } from '@telegram-apps/sdk-react'

const win = typeof window !== 'undefined' ? window : null

// Check if we're in Telegram Mini App environment
export function checkTelegramEnv(): boolean {
  if (!win) return false
  const telegram = (win as unknown as { Telegram?: { WebApp?: { initData?: string; version?: string } } }).Telegram
  if (!telegram?.WebApp) return false
  
  // On mobile Telegram, initData is always present
  // On desktop/web, it might be present too
  // The presence of WebApp object itself is enough indicator
  return true
}

export const isTelegramEnv = checkTelegramEnv()

// Helper to get Telegram WebApp instance with better type safety
export function getTelegramWebApp() {
  if (!isTelegramEnv || !win) return null
  return (win as unknown as { Telegram?: { WebApp?: { 
    setHeaderColor?: (color: string) => void
    expand?: () => void
    ready?: () => void
    openInvoice?: (url: string, cb: (status: string) => void) => void
    initData?: string
    version?: string
    platform?: string
  } } }).Telegram?.WebApp
}

// Wait for Telegram WebApp SDK to be fully initialized (especially on mobile)
export async function waitForTelegramWebApp(maxWait = 3000): Promise<typeof window.Telegram.WebApp | null> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWait) {
    const tg = getTelegramWebApp()
    if (tg) {
      // Check if openInvoice is available - this is the key indicator
      if (typeof tg.openInvoice === 'function') {
        console.log('✅ openInvoice found after', Date.now() - startTime, 'ms')
        return tg
      }
      // Also return if initData is present (indicates proper initialization)
      if (tg.initData) {
        console.log('✅ initData found after', Date.now() - startTime, 'ms')
        return tg
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Return even if we timed out - openInvoice might still work
  const tg = getTelegramWebApp()
  if (tg && typeof tg.openInvoice === 'function') {
    console.log('⚠️ Returning WebApp after timeout, but openInvoice exists')
    return tg
  }
  
  console.warn('⚠️ WebApp not fully initialized after timeout')
  return tg
}

// Check if Telegram Stars payments are available with detailed diagnostics
export function checkStarsAvailability(): { 
  available: boolean
  reason?: string
  diagnostics?: {
    hasWebApp: boolean
    hasInitData: boolean
    hasOpenInvoice: boolean
    version?: string
    platform?: string
    initDataLength?: number
  }
} {
  const tg = getTelegramWebApp()
  const diagnostics = {
    hasWebApp: !!tg,
    hasInitData: !!tg?.initData,
    hasOpenInvoice: typeof tg?.openInvoice === 'function',
    version: tg?.version,
    platform: tg?.platform,
    initDataLength: tg?.initData?.length,
  }
  
  console.log('🔍 Stars Availability Check:', diagnostics)
  
  if (!tg) {
    return { 
      available: false, 
      reason: 'Telegram WebApp SDK not loaded',
      diagnostics
    }
  }
  
  // Check if initData exists (indicates proper initialization)
  if (!tg.initData) {
    console.warn('⚠️ initData missing - WebApp may not be fully initialized')
    return { 
      available: false, 
      reason: 'Telegram WebApp not fully initialized',
      diagnostics
    }
  }
  
  // Check if openInvoice method exists
  if (!tg.openInvoice) {
    console.error('❌ openInvoice method not available')
    console.error('Available methods:', Object.keys(tg))
    return { 
      available: false, 
      reason: 'Stars payments not available - may be region/version restriction',
      diagnostics
    }
  }
  
  console.log('✅ Stars payments appear to be available')
  return { 
    available: true,
    diagnostics
  }
}

// Get detailed Telegram environment info for debugging
export function getTelegramDebugInfo(): Record<string, unknown> {
  const tg = getTelegramWebApp()
  const win = window as unknown as { Telegram?: unknown }
  
  return {
    hasTelegram: !!win.Telegram,
    hasWebApp: !!tg,
    hasInitData: !!tg?.initData,
    hasOpenInvoice: typeof tg?.openInvoice === 'function',
    version: tg?.version,
    platform: tg?.platform,
    initDataLength: tg?.initData?.length,
    initDataPreview: tg?.initData?.substring(0, 50),
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    allWebAppMethods: tg ? Object.keys(tg) : [],
  }
}

export function initTelegram() {
  // Debug: Check if Telegram script is loaded
  console.log('initTelegram: window.Telegram exists?', !!(window as unknown as { Telegram?: unknown }).Telegram)
  console.log('initTelegram: window.Telegram?.WebApp exists?', !!(window as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp)
  
  if (isTelegramEnv) {
    try {
      init()
      const tg = getTelegramWebApp()
      console.log('initTelegram: tg after init:', tg)
      console.log('initTelegram: tg.openInvoice exists?', !!tg?.openInvoice)
      console.log('initTelegram: tg.initData exists?', !!tg?.initData)
      console.log('initTelegram: tg.version:', tg?.version)
      console.log('initTelegram: tg.platform:', tg?.platform)
      
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
    } catch (e) {
      console.error('initTelegram error:', e)
    }
  }
}
