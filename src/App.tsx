import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { useTelegramUser } from '@/hooks/useTelegramUser'
import { isTelegramEnv } from '@/lib/telegram'
import Home from '@/pages/Home'
import Input from '@/pages/Input'
import Loading from '@/pages/Loading'
import Result from '@/pages/Result'
import Talisman from '@/pages/Talisman'
import TalismanResult from '@/pages/TalismanResult'
import ReportResult from '@/pages/ReportResult'
import CoupleCompatibility from '@/pages/CoupleCompatibility'
import CoupleResult from '@/pages/CoupleResult'
import MonthlyFortune from '@/pages/MonthlyFortune'

function MockUserProvider({ children }: { children: React.ReactNode }) {
  const setTelegramUser = useAppStore((s) => s.setTelegramUser)
  useEffect(() => {
    setTelegramUser({ id: 123456789, username: 'dev_user', languageCode: 'en' })
  }, [setTelegramUser])
  return <>{children}</>
}

function AppContent() {

  const telegramUser = useAppStore((s) => s.telegramUser)
  useEffect(() => {
    if (!telegramUser?.languageCode) return
    import('./i18n').then(({ default: i18n }) => {
      const langMap: Record<string, string> = {
        en: 'en', ar: 'ar', ko: 'ko', ja: 'ja', es: 'es',
        'en-US': 'en', 'en-GB': 'en',
      }
      const lang = langMap[telegramUser.languageCode ?? ''] ?? 'en'
      i18n.changeLanguage(lang)
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    })
  }, [telegramUser?.languageCode])

  // Debug: Log Telegram environment info on app start
  useEffect(() => {
    if (isTelegramEnv) {
      setTimeout(() => {
        import('./lib/telegram').then(({ getTelegramDebugInfo, checkStarsAvailability }) => {
          const debugInfo = getTelegramDebugInfo()
          const starsCheck = checkStarsAvailability()
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('🔍 Telegram 환경 진단 정보')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('Telegram WebApp:', debugInfo.hasWebApp ? '✅ 있음' : '❌ 없음')
          console.log('initData:', debugInfo.hasInitData ? '✅ 있음' : '❌ 없음')
          console.log('openInvoice 메서드:', debugInfo.hasOpenInvoice ? '✅ 있음' : '❌ 없음')
          console.log('Telegram 버전:', debugInfo.version || '알 수 없음')
          console.log('플랫폼:', debugInfo.platform || '알 수 없음')
          console.log('언어:', debugInfo.language || '알 수 없음')
          console.log('타임존:', debugInfo.timezone || '알 수 없음')
          console.log('Stars 결제 가능:', starsCheck.available ? '✅ 가능' : '❌ 불가능')
          if (!starsCheck.available) {
            console.log('사유:', starsCheck.reason)
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('전체 진단 정보:', debugInfo)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        })
      }, 1000)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-[family-name:var(--font-inter)]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/input" element={<Input />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/result" element={<Result />} />
        <Route path="/talisman" element={<Talisman />} />
        <Route path="/talisman/result" element={<TalismanResult />} />
        <Route path="/couple" element={<CoupleCompatibility />} />
        <Route path="/couple/result" element={<CoupleResult />} />
        <Route path="/monthly-fortune" element={<MonthlyFortune />} />
        <Route path="/report/result" element={<ReportResult />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  if (isTelegramEnv) {
    return <AppWithTelegram />
  }
  return (
    <MockUserProvider>
      <AppContent />
    </MockUserProvider>
  )
}

function AppWithTelegram() {
  useTelegramUser()
  return <AppContent />
}

export default App
