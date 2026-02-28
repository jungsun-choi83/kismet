import { useEffect } from 'react'
import { useLaunchParams } from '@telegram-apps/sdk-react'
import { useAppStore } from '@/store'
import { getTelegramUserFromWebApp } from '@/lib/telegram'

type LaunchParams = {
  initData?: { user?: { id: number; username?: string; language_code?: string } }
  tgWebAppData?: { user?: { id: number; username?: string; languageCode?: string } }
}

function useLaunchParamsSafe(): LaunchParams | undefined {
  try {
    return useLaunchParams(true) as LaunchParams
  } catch {
    return undefined
  }
}

export function useTelegramUser() {
  const launchParams = useLaunchParamsSafe()
  const setTelegramUser = useAppStore((s) => s.setTelegramUser)

  useEffect(() => {
    const applyUser = (u: { id: number; username?: string; languageCode?: string }) => {
      setTelegramUser({ id: u.id, username: u.username, languageCode: u.languageCode })
    }

    // 1) Native initDataUnsafe first (same as Oneiro bot - most reliable in Telegram)
    const nativeUser = getTelegramUserFromWebApp()
    if (nativeUser) {
      applyUser(nativeUser)
      return
    }

    // 2) SDK launchParams fallback
    const sdkUser = launchParams?.initData?.user ?? launchParams?.tgWebAppData?.user
    if (sdkUser) {
      applyUser({
        id: sdkUser.id,
        username: sdkUser.username,
        languageCode: (sdkUser as { language_code?: string }).language_code ?? (sdkUser as { languageCode?: string }).languageCode,
      })
      return
    }

    // 3) Poll for native API (Telegram may inject WebApp late on mobile)
    let attempts = 0
    const maxAttempts = 25
    const iv = setInterval(() => {
      const u = getTelegramUserFromWebApp()
      if (u) {
        clearInterval(iv)
        applyUser(u)
        return
      }
      attempts++
      if (attempts >= maxAttempts) {
        clearInterval(iv)
        applyUser({ id: 123456789, username: 'dev_user', languageCode: 'en' })
      }
    }, 200)
    return () => clearInterval(iv)
  }, [launchParams, setTelegramUser])
}
