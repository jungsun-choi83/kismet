import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { calculateBazi } from '@/lib/bazi'

export default function CoupleCompatibility() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const telegramUser = useAppStore((s) => s.telegramUser)
  const sajuResult = useAppStore((s) => s.sajuResult)
  const [partnerBirthDate, setPartnerBirthDate] = useState('')
  const [partnerBirthTime, setPartnerBirthTime] = useState<string | null>(null)
  const [partnerGender, setPartnerGender] = useState<'male' | 'female' | 'other'>('male')
  const [partnerCalendarType, setPartnerCalendarType] = useState<'solar' | 'lunar'>('solar')
  const [timeUnknown, setTimeUnknown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidDate = (dateStr: string): boolean => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return false
    const [y, m, day] = dateStr.split('-').map(Number)
    return d.getUTCFullYear() === y && d.getUTCMonth() + 1 === m && d.getUTCDate() === day
  }

  const canSubmit = partnerBirthDate && partnerGender && isValidDate(partnerBirthDate) && sajuResult

  const handleSubmit = async () => {
    if (!canSubmit || !telegramUser?.id || !sajuResult) return
    setLoading(true)
    setError(null)

    try {
      const partnerSaju = calculateBazi(partnerBirthDate, timeUnknown ? null : partnerBirthTime, partnerCalendarType)
      
      // Import waitForTelegramWebApp helper
      const { waitForTelegramWebApp } = await import('@/lib/telegram')
      
      // Wait for Telegram WebApp SDK to be fully initialized (especially important on mobile)
      const tg = await waitForTelegramWebApp(3000)
      
      if (!tg || !tg.openInvoice) {
        const { checkStarsAvailability } = await import('@/lib/telegram')
        const starsCheck = checkStarsAvailability()
        
        if (!tg?.initData) {
          setError('Telegram WebApp SDK가 완전히 초기화되지 않았습니다. 앱을 새로고침해주세요.')
        } else {
          setError('한국에서는 Telegram Stars 결제가 제한될 수 있습니다. Telegram 앱을 최신 버전으로 업데이트해주세요.')
        }
        setLoading(false)
        return
      }
      
      // Ensure WebApp is ready
      tg.ready?.()
      tg.expand?.()
      await new Promise(resolve => setTimeout(resolve, 300))

      const res = await fetch('/api/payment?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUserId: telegramUser.id,
          product: 'couple',
          partnerSaju,
        }),
      })
      const data = await res.json() as { invoiceLink?: string; error?: string }
      if (!data.invoiceLink) {
        setError(data.error ?? 'Failed')
        setLoading(false)
        return
      }
      tg.openInvoice(data.invoiceLink, (status) => {
        setLoading(false)
        if (status === 'paid') navigate('/couple/result')
      })
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  if (!sajuResult) {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen gradient-mystic pb-24">
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-2">
          {t('couple.title')}
        </h1>
        <p className="text-center text-[var(--color-text-muted)] text-sm mb-8">
          {t('couple.subtitle')}
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('couple.partnerBirthDate')}
            </label>
            <input
              type="date"
              value={partnerBirthDate}
              onChange={(e) => setPartnerBirthDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-tertiary)] text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('couple.partnerBirthTime')}
            </label>
            <div className="flex gap-3">
              <input
                type="time"
                value={partnerBirthTime ?? ''}
                onChange={(e) => setPartnerBirthTime(e.target.value)}
                disabled={timeUnknown}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-tertiary)] text-white disabled:opacity-50"
              />
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-tertiary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={timeUnknown}
                  onChange={(e) => {
                    setTimeUnknown(e.target.checked)
                    if (e.target.checked) setPartnerBirthTime(null)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">{t('couple.partnerBirthTimeUnknown')}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('couple.partnerGender')}
            </label>
            <div className="flex gap-3">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPartnerGender(g)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    partnerGender === g
                      ? 'bg-[var(--color-accent)] text-black'
                      : 'bg-[var(--color-secondary)] text-white'
                  }`}
                >
                  {t(`onboarding.gender${g.charAt(0).toUpperCase() + g.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('couple.partnerCalendarType')}
            </label>
            <div className="flex gap-3">
              {(['solar', 'lunar'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPartnerCalendarType(c)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    partnerCalendarType === c
                      ? 'bg-[var(--color-accent)] text-black'
                      : 'bg-[var(--color-secondary)] text-white'
                  }`}
                >
                  {t(`onboarding.calendar${c.charAt(0).toUpperCase() + c.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full mt-8 py-4 rounded-full gradient-gold text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('common.loading') : t('couple.generate')}
        </button>
      </div>
    </div>
  )
}
