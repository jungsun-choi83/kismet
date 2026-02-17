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
