import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'

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
  const { telegramUser, setTalismanSelection } = useAppStore()
  const [wish, setWish] = useState<string | null>(null)
  const [style, setStyle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const canGenerate = wish && style

  const handleGenerate = async () => {
    if (!canGenerate || !telegramUser) {
      setError('Please select a wish and style.')
      return
    }
    
    const win = window as unknown as { Telegram?: { WebApp?: { openInvoice?: (url: string, cb: (s: string) => void) => void } } }
    const tg = win.Telegram?.WebApp
    
    if (!tg?.openInvoice) {
      setError('Please open this app from Telegram to purchase.')
      return
    }
    
    setLoading(true)
    setError(null)
    setDebugInfo([])
    
    try {
      const debugMsg1 = 'Creating invoice for personal_talisman...'
      console.log(debugMsg1)
      setDebugInfo([debugMsg1])
      
      const res = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUserId: telegramUser.id,
          product: 'personal_talisman',
          wish: wish!,
          style: style!,
        }),
      })
      
      const data = await res.json() as { invoiceLink?: string; error?: string }
      
      const debugMsg2 = `Invoice response: ${JSON.stringify(data)}`
      console.log(debugMsg2)
      setDebugInfo([debugMsg1, debugMsg2])
      
      if (!data.invoiceLink) {
        const errorMsg = data.error ?? 'Failed to create invoice. Please try again.'
        setError(errorMsg)
        setDebugInfo([debugMsg1, debugMsg2, `ERROR: ${errorMsg}`])
        setLoading(false)
        return
      }
      
      const debugMsg3 = `Opening invoice: ${data.invoiceLink}`
      console.log(debugMsg3)
      setDebugInfo([debugMsg1, debugMsg2, debugMsg3])
      
      tg.openInvoice(data.invoiceLink, async (status) => {
        const debugMsg4 = `Payment status: ${status}`
        console.log(debugMsg4)
        setDebugInfo([debugMsg1, debugMsg2, debugMsg3, debugMsg4])
        
        if (status === 'paid') {
          let attempts = 0
          const maxAttempts = 10
          const pollInterval = 1000
          
          const pollPayment = async (): Promise<void> => {
            try {
              const checkRes = await fetch('/api/check-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  telegram_user_id: telegramUser.id,
                  product: 'personal_talisman',
                }),
              })
              
              const checkData = await checkRes.json() as { paid?: boolean; status?: string }
              
              if (checkData.paid) {
                setTalismanSelection(wish!, style!)
                navigate('/talisman/result?paid=1')
                return
              }
              
              if (attempts < maxAttempts) {
                attempts++
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                return pollPayment()
              }
              
              console.warn('Payment confirmed by Telegram but not yet in database. Webhook will process it.')
              setTalismanSelection(wish!, style!)
              navigate('/talisman/result?paid=1')
            } catch (e) {
              console.error('Error polling payment status:', e)
              setTalismanSelection(wish!, style!)
              navigate('/talisman/result?paid=1')
            }
          }
          
          await pollPayment()
        } else {
          setLoading(false)
          if (status === 'failed' || status === 'cancelled') {
            setError('Payment was cancelled or failed.')
          } else {
            setError(`Payment status: ${status}`)
          }
          setDebugInfo([debugMsg1, debugMsg2, debugMsg3, debugMsg4, `Payment failed or cancelled: ${status}`])
        }
      })
    } catch (e) {
      const errorMsg = (e as Error).message ?? 'Failed to process payment. Please try again.'
      console.error('Error in handleGenerate:', e)
      setError(errorMsg)
      setDebugInfo([...debugInfo, `ERROR: ${errorMsg}`])
      setLoading(false)
    }
  }

  const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=400&fit=crop'

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
                src={PLACEHOLDER_IMAGE}
                alt="Talisman Preview"
                className="w-full h-full object-cover blur-sm opacity-60"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
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
          <div className="mb-4">
            <p className="text-red-400 text-sm text-center font-semibold mb-2">{error}</p>
            {debugInfo.length > 0 && (
              <div className="bg-black/50 rounded-lg p-3 text-xs text-gray-300 space-y-1 max-h-40 overflow-y-auto">
                <p className="font-semibold text-yellow-400 mb-1">Debug Info:</p>
                {debugInfo.map((msg, i) => (
                  <p key={i} className="break-all">{msg}</p>
                ))}
              </div>
            )}
          </div>
        )}
        
        {!error && debugInfo.length > 0 && (
          <div className="mb-4 bg-black/30 rounded-lg p-3 text-xs text-gray-400 space-y-1 max-h-32 overflow-y-auto">
            <p className="font-semibold text-blue-400 mb-1">Status:</p>
            {debugInfo.map((msg, i) => (
              <p key={i} className="break-all">{msg}</p>
            ))}
          </div>
        )}

        {canGenerate ? (
          <>
            <p className="text-center text-sm text-[var(--color-accent)] mb-4">
              ⭐ 250 Stars (≈ $5)
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 rounded-full gradient-gold text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : 'Get My Talisman'}
            </button>
          </>
        ) : (
          <div className="bg-[var(--color-secondary)] rounded-2xl p-6 text-center">
            <p className="text-[var(--color-text-muted)] text-sm">
              Please select a wish and style to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
