import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { callCreateInvoice } from '@/lib/api'
import { supabase, isDemoMode } from '@/lib/supabase'

const WISHES = ['wealth', 'love', 'career', 'protection', 'examSuccess', 'health'] as const
const STYLES = [
  { id: 'traditional', labelKey: 'traditional', descKey: 'traditionalDesc', emoji: '📜' },
  { id: 'modern', labelKey: 'modern', descKey: 'modernDesc', emoji: '◇' },
  { id: 'fantasy', labelKey: 'fantasy', descKey: 'fantasyDesc', emoji: '✨' },
  { id: 'cosmic', labelKey: 'cosmic', descKey: 'cosmicDesc', emoji: '🌌' },
] as const

export default function Talisman() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { telegramUser, setFreeTrialUsed, setTalismanSelection } =
    useAppStore()
  const [wish, setWish] = useState<string | null>(null)
  const [style, setStyle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFree, setIsFree] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      setIsFree(true)
      return
    }
    if (!telegramUser?.id) return
    void (async () => {
      try {
        const { data } = await supabase.from('users').select('free_trial_used').eq('telegram_id', telegramUser.id).single()
        setIsFree(!data?.free_trial_used)
      } catch {
        setIsFree(true)
      }
    })()
  }, [telegramUser?.id])

  const canGenerate = wish && style

  const handleGenerate = async () => {
    if (!canGenerate || !telegramUser) return
    setLoading(true)
    setError(null)

    try {
      if (isFree) {
        setTalismanSelection(wish, style)
        setFreeTrialUsed(true)
        navigate('/talisman/result')
        return
      }

      const win = window as unknown as { Telegram?: { WebApp?: { showConfirm?: (msg: string) => Promise<boolean> | boolean; openInvoice?: (url: string, cb: (status: string) => void) => void } } }
      const tg = win.Telegram?.WebApp
      const confirmMsg = 'Confirm payment of 50 Stars?'

      const showPaymentConfirm = async () => {
        if (tg?.showConfirm) return Promise.resolve(tg.showConfirm(confirmMsg))
        return Promise.resolve(window.confirm(confirmMsg))
      }

      if (isDemoMode || !tg?.openInvoice) {
        const ok = await showPaymentConfirm()
        setLoading(false)
        if (ok) {
          setTalismanSelection(wish, style)
          navigate('/talisman/result')
        }
        return
      }

      const ok = await showPaymentConfirm()
      if (!ok) {
        setLoading(false)
        return
      }

      const { invoiceLink } = await callCreateInvoice(
        telegramUser.id,
        'talisman',
        wish,
        style
      )
      tg.openInvoice(invoiceLink, (status) => {
        setLoading(false)
        if (status === 'paid') {
          setTalismanSelection(wish, style)
          navigate('/talisman/result')
        } else {
          setError('Payment was cancelled or failed.')
        }
      })
    } catch (e) {
      setError((e as Error).message ?? 'Failed')
      setLoading(false)
    }
  }

  const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=400&fit=crop'
  const previewUrl = PLACEHOLDER_IMAGE

  return (
    <div className="min-h-screen gradient-mystic pb-24">
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-8">
          {t('talisman.title')}
        </h1>

        <div className="mb-8">
          <h2 className="text-sm text-[var(--color-text-muted)] mb-3">{t('talisman.wish')}</h2>
          <div className="flex flex-wrap gap-2">
            {WISHES.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWish(w)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  wish === w
                    ? 'bg-[var(--color-accent)] text-black ring-2 ring-[var(--color-accent)]'
                    : 'bg-[var(--color-tertiary)] text-white hover:opacity-90'
                }`}
              >
                {t(`talisman.${w}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm text-[var(--color-text-muted)] mb-3">{t('talisman.style')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`p-4 rounded-xl text-left transition-colors ${
                  style === s.id
                    ? 'bg-[var(--color-accent)]/20 ring-2 ring-[var(--color-accent)]'
                    : 'bg-[var(--color-secondary)] hover:bg-[var(--color-tertiary)]'
                }`}
              >
                <span className="text-2xl mb-2 block">{s.emoji}</span>
                <p className="font-medium text-sm">{t(`talisman.${s.labelKey}`)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t(`talisman.${s.descKey}`)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {canGenerate && (
          <div className="mb-6 relative rounded-2xl overflow-hidden bg-[var(--color-secondary)]">
            <div className="aspect-square relative">
              <img
                src={previewUrl}
                alt="Talisman Preview"
                className="w-full h-full object-cover blur-sm opacity-60"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=400&fit=crop'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-2xl font-bold text-white/80">Preview</span>
              </div>
            </div>
            <p className="p-3 text-center text-sm text-[var(--color-text-muted)]">
              {t('talisman.previewHint')}
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <p className="text-center text-sm text-[var(--color-accent)] mb-4">
          {isFree ? `🎁 ${t('talisman.freeFirst')}` : `⭐ ${t('talisman.price')}`}
        </p>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          className="w-full py-4 rounded-full gradient-gold text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('common.loading') : isFree ? t('talisman.generateFree') : t('talisman.unlockSeal')}
        </button>
      </div>
    </div>
  )
}
