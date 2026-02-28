import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'

const BOT_APP_LINK = 'https://t.me/kismet_saju_bot/app'

export default function MonthlyFortune() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const telegramUser = useAppStore((s) => s.telegramUser)
  const sajuResult = useAppStore((s) => s.sajuResult)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fortuneHtml, setFortuneHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: { expand?: () => void } } }).Telegram?.WebApp
    tg?.expand?.()
  }, [])

  useEffect(() => {
    if (!telegramUser?.id) {
      navigate('/')
      return
    }
    fetch(`/api/data?type=subscription&telegram_user_id=${telegramUser.id}`)
      .then((r) => r.json())
      .then((data: { active?: boolean }) => {
        setSubscriptionActive(data.active ?? false)
        setLoading(false)
      })
      .catch(() => {
        setSubscriptionActive(false)
        setLoading(false)
      })
  }, [telegramUser?.id, navigate])

  useEffect(() => {
    if (subscriptionActive && sajuResult && !fortuneHtml && !loading) {
      handleGenerate()
    }
  }, [subscriptionActive, sajuResult])

  const handleGenerate = async () => {
    if (!sajuResult || !subscriptionActive || !telegramUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const res = await fetch('/api/data?type=monthly-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_user_id: telegramUser.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      })
      const data = await res.json() as { fortune?: string; error?: string }
      if (data.fortune) {
        setFortuneHtml(data.fortune)
      } else {
        setError(data.error ?? 'Failed to generate')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async () => {
    if (!telegramUser?.id) {
      setError('Please open this app from Telegram Mini App.')
      return
    }
    
    // Import waitForTelegramWebApp helper
    const { waitForTelegramWebApp } = await import('@/lib/telegram')
    
    // Wait for Telegram WebApp SDK to be fully initialized (especially important on mobile)
    const tg = await waitForTelegramWebApp(3000)
    
      if (!tg || !tg.openInvoice) {
        if (!tg?.initData) {
        setError('Telegram WebApp SDK가 완전히 초기화되지 않았습니다. 앱을 새로고침해주세요.')
      } else {
        setError('한국에서는 Telegram Stars 결제가 제한될 수 있습니다. Telegram 앱을 최신 버전으로 업데이트해주세요.')
      }
      return
    }
    
    // Ensure WebApp is ready
    tg.ready?.()
    tg.expand?.()
    await new Promise(resolve => setTimeout(resolve, 300))
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payment?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUserId: telegramUser.id, product: 'monthly_fortune' }),
      })
      const data = await res.json() as { invoiceLink?: string; error?: string }
      if (!data.invoiceLink) {
        setError(data.error ?? 'Failed')
        setLoading(false)
        return
      }
      tg.openInvoice(data.invoiceLink, (status: string) => {
        setLoading(false)
        if (status === 'paid') {
          setSubscriptionActive(true)
          handleGenerate()
        }
      })
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  const handleShare = () => {
    const win = window as unknown as { Telegram?: { WebApp?: { switchInlineQuery?: (q: string) => void } } }
    const text = '📅 Check out my monthly fortune! ' + BOT_APP_LINK
    if (win.Telegram?.WebApp?.switchInlineQuery) {
      win.Telegram.WebApp.switchInlineQuery(text)
    } else {
      navigator.clipboard?.writeText(text).then(() => alert('Link copied.'))
    }
  }

  if (loading && !fortuneHtml) {
    return (
      <div className="min-h-screen gradient-mystic flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 border-2 border-[var(--color-accent)]/50 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[var(--color-text-muted)]">{t('monthlyFortune.loading')}</p>
      </div>
    )
  }

  if (!subscriptionActive) {
    return (
      <div className="min-h-screen gradient-mystic pb-24">
        <div className="max-w-md mx-auto px-4 py-8">
          <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-2">
            {t('monthlyFortune.title')}
          </h1>
          <p className="text-center text-[var(--color-text-muted)] text-sm mb-8">
            {t('monthlyFortune.subtitle')}
          </p>
          <p className="text-center text-[var(--color-text-muted)] mb-8">
            {t('monthlyFortune.noSubscription')}
          </p>
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full py-4 rounded-full gradient-gold text-black font-semibold disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('monthlyFortune.getSubscription')}
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen gradient-mystic pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-2">
          {t('monthlyFortune.title')}
        </h1>
        <p className="text-center text-[var(--color-text-muted)] text-sm mb-8">
          {t('monthlyFortune.subtitle')}
        </p>

        {fortuneHtml && (
          <article
            className="bg-[var(--color-secondary)]/80 rounded-2xl p-6 md:p-8 text-[var(--color-text)] prose prose-invert prose-headings:text-[var(--color-accent)] prose-p:text-[var(--color-text)] prose-p:leading-relaxed prose-li:text-[var(--color-text)] max-w-none
              [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2
              [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-1
              [&_p]:text-sm [&_p]:mb-3
              [&_ul]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3"
            dangerouslySetInnerHTML={{ __html: fortuneHtml }}
          />
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-full border-2 border-[var(--color-accent)] text-[var(--color-accent)] font-medium"
          >
            {t('monthlyFortune.share')}
          </button>
          <button
            onClick={() => navigate('/result')}
            className="w-full py-3 rounded-full bg-[var(--color-tertiary)] font-medium"
          >
            Back to Result
          </button>
        </div>
      </div>
    </div>
  )
}
