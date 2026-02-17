import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'

const DEFAULT_GUIDE = 'Keep this talisman as your phone wallpaper or in a visible place. Meditate on your wish while viewing it to amplify its energy.'

export default function TalismanResult() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sajuResult, talismanWish, talismanStyle, talismanResult, setTalismanResult, telegramUser } =
    useAppStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageVisible, setImageVisible] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isPaid = urlParams.get('paid') === '1'

    if (isPaid && telegramUser?.id) {
      setLoading(true)
      fetch(`/api/talisman-result?telegram_user_id=${telegramUser.id}`)
        .then((r) => r.json())
        .then((data: { result_url?: string; wish?: string; style?: string }) => {
          if (data.result_url) {
            setTalismanResult({
              imageUrl: data.result_url,
              wish: data.wish ?? 'blessing',
              style: data.style ?? 'traditional',
              guide: DEFAULT_GUIDE,
            })
            requestAnimationFrame(() => setImageVisible(true))
          } else {
            setError('Talisman not found')
          }
        })
        .catch(() => setError('Failed to load talisman'))
        .finally(() => setLoading(false))
      return
    }

    // 결제 없이는 부적 생성 불가 - 항상 결제 필요
    if (!isPaid) {
      setError('Please purchase a talisman first.')
      setTimeout(() => navigate('/talisman'), 2000)
      return
    }

    if (!sajuResult || !talismanWish || !talismanStyle || !telegramUser) {
      navigate('/talisman')
      return
    }

    // 결제된 부적만 표시 - DB에서 가져오기
    if (isPaid && telegramUser?.id) {
      // 이미 위에서 처리됨 (24-43줄)
      return
    }
  }, [sajuResult, talismanWish, talismanStyle, telegramUser, setTalismanResult, navigate])

  const handleSave = () => {
    if (!talismanResult?.imageUrl) return
    const a = document.createElement('a')
    a.href = talismanResult.imageUrl
    a.download = `kismet-talisman-${talismanResult.wish}-${talismanResult.style}.png`
    a.click()
  }

  const handleShare = () => {
    const win = window as unknown as { Telegram?: { WebApp?: { switchInlineQuery?: (query: string) => void } } }
    const appLink = 'https://t.me/kismet_saju_bot/app'
    const text = t('talismanResult.shareText') + ' ' + appLink
    if (win.Telegram?.WebApp?.switchInlineQuery) {
      win.Telegram.WebApp.switchInlineQuery(text)
    } else {
      navigator.share?.({
        title: 'KISMET Talisman',
        text,
        url: appLink,
      }).catch(() => {})
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-mystic flex flex-col items-center justify-center px-6">
        <div className="w-64 h-64 flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/40 animate-spin" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-4 rounded-full border-2 border-[var(--color-purple)]/40 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
          <div className="w-28 h-28 rounded-full bg-[var(--color-secondary)]/80 flex items-center justify-center border-2 border-[var(--color-accent)]/50">
            <svg viewBox="0 0 100 100" className="w-20 h-20 text-[var(--color-accent)] animate-spin" style={{ animationDuration: '6s' }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <path fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" d="M50 5 Q80 50 50 95 Q20 50 50 5" />
              <circle cx="50" cy="28" r="6" fill="currentColor" opacity="0.9" />
              <circle cx="50" cy="72" r="6" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
        </div>
        <p className="text-[var(--color-text-muted)]">{t('talismanResult.creating')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-mystic flex flex-col items-center justify-center px-6">
        <p className="text-red-400 mb-2 text-center">{t('talismanResult.failed')}</p>
        <p className="text-[var(--color-text-muted)] text-sm mb-6 text-center max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-full gradient-gold text-black font-semibold"
        >
          {t('talismanResult.retry')}
        </button>
      </div>
    )
  }

  if (!talismanResult) return null

  return (
    <div className="min-h-screen gradient-mystic pb-24">
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-8">
          {t('app.title')}
        </h1>

        <div className="rounded-2xl p-2 gradient-gold mb-4">
          <div className="rounded-xl overflow-hidden bg-[var(--color-background)]">
            <img
              src={talismanResult.imageUrl}
              alt="Talisman"
              className={`w-full aspect-square object-cover transition-opacity duration-1000 ${imageVisible ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        </div>

        <p className="text-center text-[var(--color-accent)]/80 text-sm italic mb-6">
          {t('talismanResult.generatedBy')}
        </p>

        <p className="text-center text-[var(--color-text-muted)] text-sm mb-6 capitalize">
          {t(`talisman.${talismanResult.wish}`)} · {t(`talisman.${talismanResult.style}`)}
        </p>

        {talismanResult.guide && (
          <div className="bg-[var(--color-secondary)] rounded-2xl p-4 mb-6">
            <h2 className="text-sm text-[var(--color-text-muted)] mb-2">
              {t('talismanResult.guide')}
            </h2>
            <p className="text-sm leading-relaxed">{talismanResult.guide}</p>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-[var(--color-secondary)] font-medium hover:bg-[var(--color-tertiary)]"
          >
            {t('talismanResult.save')}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl gradient-gold text-black font-medium"
          >
            {t('talismanResult.share')}
          </button>
        </div>

        <button
          onClick={() => navigate('/talisman')}
          className="w-full py-4 rounded-full border-2 border-[var(--color-accent)] text-[var(--color-accent)] font-semibold"
        >
          {t('talismanResult.createAnother')}
        </button>
      </div>
    </div>
  )
}
