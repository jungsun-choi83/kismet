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

// Helper to get Telegram WebApp instance - always checks fresh (SDK may inject late on mobile)
export function getTelegramWebApp() {
  if (!win) return null
  // Don't use cached isTelegramEnv - SDK may load after our module
  return (win as unknown as { Telegram?: { WebApp?: { 
    setHeaderColor?: (color: string) => void
    expand?: () => void
    ready?: () => void
    openInvoice?: (url: string, cb: (status: string) => void) => void
    initData?: string
    version?: string
    platform?: string
  } } }).Telegram?.WebApp ?? null
}

// Read WebApp directly from window (no module cache)
function getWebAppRaw(): unknown {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { Telegram?: { WebApp?: unknown } }
  return w.Telegram?.WebApp ?? null
}

// Wait for Telegram WebApp; if not present after 2s, load script and wait more (Mini App client may inject late)
export async function waitForTelegramWebApp(maxWait = 8000): Promise<ReturnType<typeof getTelegramWebApp>> {
  const startTime = Date.now()
  const SCRIPT_LOAD_AFTER = 2000

  while (Date.now() - startTime < maxWait) {
    const tg = getWebAppRaw() as ReturnType<typeof getTelegramWebApp>
    if (tg && typeof (tg as { openInvoice?: unknown }).openInvoice === 'function') {
      console.log('✅ openInvoice found after', Date.now() - startTime, 'ms')
      return tg
    }
    if (tg && (tg as { initData?: string }).initData) {
      const t = tg as { openInvoice?: (url: string, cb: (s: string) => void) => void }
      if (typeof t.openInvoice === 'function') return tg
    }
    // After 2s without WebApp, try loading the script once (for WebViews where client didn't inject)
    if (Date.now() - startTime >= SCRIPT_LOAD_AFTER && !getWebAppRaw()) {
      if (!(document as unknown as { _tgScriptLoaded?: boolean })._tgScriptLoaded) {
        (document as unknown as { _tgScriptLoaded?: boolean })._tgScriptLoaded = true
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-web-app.js'
        script.async = false
        document.head.appendChild(script)
        await new Promise(r => setTimeout(r, 500))
      }
    }
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  const tg = getWebAppRaw() as ReturnType<typeof getTelegramWebApp>
  if (tg && typeof (tg as { openInvoice?: unknown }).openInvoice === 'function') return tg
  console.warn('⚠️ WebApp not ready after', maxWait, 'ms')
  return tg || null
}

/** Open invoice by URL. Prefer SDK (works on Desktop/Android when native openInvoice is missing), then window.Telegram.WebApp.openInvoice. */
export function openInvoiceUrl(invoiceUrl: string): Promise<'paid' | 'cancelled' | 'failed' | string> {
  return new Promise((resolve) => {
    // 1) Try SDK first - same bridge that provided launch params; works on Desktop/Android
    import('@telegram-apps/sdk').then((sdk) => {
      const invoice = (sdk as { invoice?: { open?: { isAvailable?: () => boolean; (url: string, type: 'url'): Promise<string> } } }).invoice
      if (invoice?.open?.isAvailable?.()) {
        invoice.open(invoiceUrl, 'url')
          .then((status) => resolve(status as 'paid' | 'cancelled' | 'failed' | string))
          .catch(() => {
            // SDK failed, try native
            tryNativeOpenInvoice(invoiceUrl, resolve)
          })
        return
      }
      tryNativeOpenInvoice(invoiceUrl, resolve)
    }).catch(() => tryNativeOpenInvoice(invoiceUrl, resolve))
  })
}

function tryNativeOpenInvoice(
  invoiceUrl: string,
  resolve: (status: 'paid' | 'cancelled' | 'failed' | string) => void
) {
  const tg = getWebAppRaw() as { openInvoice?: (url: string, cb: (status: string) => void) => void } | null
  if (tg && typeof tg.openInvoice === 'function') {
    tg.openInvoice(invoiceUrl, (status) => resolve(status))
    return
  }
  resolve('failed')
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

// Get Telegram user from native initDataUnsafe (most reliable when in Telegram app)
export function getTelegramUserFromWebApp(): { id: number; username?: string; languageCode?: string } | null {
  if (typeof window === 'undefined') return null
  const tg = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id: number; username?: string; language_code?: string } } } } }).Telegram?.WebApp
  const user = tg?.initDataUnsafe?.user
  if (!user?.id) return null
  return {
    id: user.id,
    username: user.username,
    languageCode: user.language_code,
  }
}

export function initTelegram() {
  // Always try to init SDK after a short delay so script (loaded at 150ms) is ready on Desktop/Android
  const runInit = () => {
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
      
      const urlParams = new URLSearchParams(window.location.search)
      const urlVersion = urlParams.get('v')
      const lastVersion = sessionStorage.getItem('app_version')
      const currentVersion = urlVersion || import.meta.env.VITE_APP_VERSION || '2'
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)))
      }
      if (urlVersion && lastVersion && urlVersion !== lastVersion) {
        sessionStorage.setItem('app_version', urlVersion)
        window.location.reload()
        return
      }
      if (!lastVersion) sessionStorage.setItem('app_version', currentVersion)
    } catch (e) {
      console.error('initTelegram error:', e)
    }
  }
  if (isTelegramEnv) {
    runInit()
  } else {
    setTimeout(runInit, 800)
  }
}
