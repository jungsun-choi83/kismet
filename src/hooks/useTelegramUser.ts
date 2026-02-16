import { useEffect } from 'react'
import { useLaunchParams } from '@telegram-apps/sdk-react'
import { useAppStore } from '@/store'

type LaunchParams = { initData?: { user?: { id: number; username?: string; language_code?: string } } }

export function useTelegramUser() {
  const launchParams = useLaunchParams(true) as LaunchParams
  const setTelegramUser = useAppStore((s) => s.setTelegramUser)

  useEffect(() => {
    const user = launchParams?.initData?.user
    if (user) {
      setTelegramUser({
        id: user.id,
        username: user.username,
        languageCode: user.language_code,
      })
    } else {
      setTelegramUser({
        id: 123456789,
        username: 'dev_user',
        languageCode: 'en',
      })
    }
  }, [launchParams?.initData?.user, setTelegramUser])
}
