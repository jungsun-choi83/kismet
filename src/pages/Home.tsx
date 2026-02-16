import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { callDailyFortune } from '@/lib/api'
import type { DailyFortune } from '@/types'

const DAILY_CACHE_KEY = 'kismet_daily_fortune'
const DAILY_CACHE_DATE_KEY = 'kismet_daily_fortune_date'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { telegramUser, sajuResult, dailyFortune, setDailyFortune, setUserExists } =
    useAppStore()
  const [tab, setTab] = useState<'home' | 'saju' | 'talisman' | 'settings'>('home')
  const [talismans, setTalismans] = useState<{ image_url: string; wish: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!telegramUser?.id) return
    void (async () => {
      try {
        const { data } = await supabase.from('users').select('id').eq('telegram_id', telegramUser.id).maybeSingle()
        setUserExists(!!data)
        if (!data) navigate('/input')
      } catch {
        setUserExists(false)
      } finally {
        setLoading(false)
      }
    })()
  }, [telegramUser?.id, setUserExists, navigate])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const cached = localStorage.getItem(DAILY_CACHE_KEY)
    const cachedDate = localStorage.getItem(DAILY_CACHE_DATE_KEY)

    if (cached && cachedDate === today) {
      try {
        setDailyFortune(JSON.parse(cached) as DailyFortune)
      } catch {}
      return
    }
    if (!sajuResult || !telegramUser?.id) return

    callDailyFortune(
      sajuResult.dayMaster,
      sajuResult.fiveElements,
      today,
      telegramUser.id
    )
      .then((data: unknown) => {
        const f = data as DailyFortune
        setDailyFortune(f)
        localStorage.setItem(DAILY_CACHE_KEY, JSON.stringify(f))
        localStorage.setItem(DAILY_CACHE_DATE_KEY, today)
      })
      .catch(() => {})
  }, [sajuResult, telegramUser?.id, setDailyFortune])

  useEffect(() => {
    if (!telegramUser?.id) return
    supabase
      .from('talismans')
      .select('image_url, wish')
      .eq('telegram_id', telegramUser.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setTalismans(data ?? []))
  }, [telegramUser?.id])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-mystic flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mystic pb-20">
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-semibold text-[var(--color-accent)] text-center mb-8">
          {t('app.title')}
        </h1>

        <div className="bg-[var(--color-secondary)] rounded-2xl p-6 mb-6 gradient-card">
          <h2 className="text-sm text-[var(--color-text-muted)] mb-2">
            {t('home.todayFortune')}
          </h2>
          {dailyFortune ? (
            <>
              <p className="text-4xl font-bold text-[var(--color-accent)] mb-2">
                {dailyFortune.score}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">{dailyFortune.summary}</p>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('common.loading')}
            </p>
          )}
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => navigate('/result')}
            className="flex-1 py-3 rounded-xl bg-[var(--color-secondary)] font-medium hover:bg-[var(--color-tertiary)]"
          >
            {t('home.fullSaju')}
          </button>
          <button
            onClick={() => showToast(t('home.comingSoon'))}
            className="flex-1 py-3 rounded-xl bg-[var(--color-secondary)] font-medium hover:bg-[var(--color-tertiary)]"
          >
            {t('home.compatibility')}
          </button>
          <button
            onClick={() => navigate('/talisman')}
            className="flex-1 py-3 rounded-xl gradient-gold text-black font-medium"
          >
            {t('home.talisman')}
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-sm text-[var(--color-text-muted)] mb-3">
            {t('home.myTalismans')}
          </h2>
          {talismans.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {talismans.map((talisman, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-[var(--color-secondary)]"
                >
                  <img
                    src={talisman.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <p className="text-xs text-center py-1 capitalize">{talisman.wish}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--color-secondary)] rounded-2xl p-6 text-center">
              <p className="text-[var(--color-text-muted)] text-sm mb-4">
                {t('home.noTalismans')}
              </p>
              <button
                onClick={() => navigate('/talisman')}
                className="px-6 py-2 rounded-full gradient-gold text-black font-medium"
              >
                {t('home.getStarted')}
              </button>
            </div>
          )}
        </div>

        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--color-tertiary)] rounded-full text-sm z-50">
            {toast}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-secondary)] border-t border-[var(--color-tertiary)] safe-area-pb">
        <div className="flex justify-around py-3 max-w-md mx-auto">
          {(['home', 'saju', 'talisman', 'settings'] as const).map((tabs) => (
            <button
              key={tabs}
              onClick={() => setTab(tabs)}
              className="flex flex-col items-center gap-1 text-sm"
            >
              <span className={tab === tabs ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}>
                {tabs === 'home' ? '🏠' : tabs === 'saju' ? '📜' : tabs === 'talisman' ? '🔮' : '⚙️'}
              </span>
              <span className={tab === tabs ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}>
                {t(`home.tabs.${tabs}`)}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
