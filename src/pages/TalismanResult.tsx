import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { callGenerateTalisman } from '@/lib/api'
import { callGenerateTalismanApi } from '@/lib/generateTalismanApi'
import { isDemoMode } from '@/lib/supabase'

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
    if (!sajuResult || !talismanWish || !talismanStyle || !telegramUser) {
      navigate('/talisman')
      return
    }

    const doGenerate = (fn: () => Promise<{ imageUrl: string; guide: string }>) => {
      fn()
        .then(({ imageUrl, guide }) => {
          setTalismanResult({
            imageUrl,
            wish: talismanWish,
            style: talismanStyle,
            guide: guide ?? DEFAULT_GUIDE,
          })
          requestAnimationFrame(() => setImageVisible(true))
        })
        .catch((e) => setError(typeof e === 'object' && e && 'message' in e ? String((e as Error).message) : String(e ?? 'Generation failed')))
        .finally(() => setLoading(false))
    }

    if (isDemoMode) {
      doGenerate(() => callGenerateTalismanApi(sajuResult, talismanWish, talismanStyle))
      return
    }

    doGenerate(() => callGenerateTalisman(sajuResult, talismanWish, talismanStyle, telegramUser.id))
  }, [sajuResult, talismanWish, talismanStyle, telegramUser, setTalismanResult, navigate])

  const handleSave = () => {
    if (!talismanResult?.imageUrl) return
    const a = document.createElement('a')
    a.href = talismanResult.imageUrl
    a.download = `kismet-talisman-${talismanResult.wish}-${talismanResult.style}.png`
    a.click()
  }

  const handleShare = () => {
    const win = window as unknown as { Telegram?: { WebApp?: { switchInlineQuery?: (query: string, chats?: string[]) => void } } }
    const text = t('talismanResult.shareText')
    if (win.Telegram?.WebApp?.switchInlineQuery) {
      win.Telegram.WebApp.switchInlineQuery(text)
    } else {
      navigator.share?.({
        title: 'KISMET Talisman',
        text,
        url: talismanResult?.imageUrl,
      }).catch(() => {})
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-mystic flex flex-col items-center justify-center px-6">
        <div className="w-64 h-64 bg-[var(--color-secondary)] rounded-2xl animate-pulse flex items-center justify-center mb-6 border-2 border-[var(--color-purple)]/50">
          <span className="text-4xl animate-pulse">🔮</span>
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
