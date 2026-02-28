import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { STEM_EN, BRANCH_ELEMENT } from '@/lib/bazi'
import { supabase } from '@/lib/supabase'
import { getTelegramUserFromWebApp } from '@/lib/telegram'

// 오행 색상: 목=초록, 화=빨강, 토=노랑, 금=흰색, 수=검정
const ELEMENT_COLORS: Record<string, string> = {
  wood: 'text-green-500',
  fire: 'text-red-500',
  earth: 'text-yellow-400',
  metal: 'text-white',
  water: 'text-slate-300',
}
const ELEMENT_BG: Record<string, string> = {
  wood: 'bg-green-500/25',
  fire: 'bg-red-500/25',
  earth: 'bg-yellow-400/25',
  metal: 'bg-white/20',
  water: 'bg-slate-600/40',
}
const ELEMENT_ICONS: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
}

export default function Result() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sajuResult = useAppStore((s) => s.sajuResult)
  const telegramUser = useAppStore((s) => s.telegramUser)
  const [unlocked, setUnlocked] = useState<{ fullReading?: boolean; talisman?: boolean }>({})

  useEffect(() => {
    // Check if user has unlocked features from DB
    if (sajuResult?.unlocked) {
      setUnlocked(sajuResult.unlocked)
    }
    
    // Also fetch from Supabase
    if (telegramUser?.id) {
      void (async () => {
        try {
          const { data } = await supabase
            .from('users')
            .select('unlocked_full_reading, unlocked_talisman')
            .eq('telegram_id', telegramUser.id)
            .single()
          if (data) {
            setUnlocked({
              fullReading: data.unlocked_full_reading ?? false,
              talisman: data.unlocked_talisman ?? false,
            })
          }
        } catch {
          // Ignore errors
        }
      })()
    }
  }, [sajuResult, telegramUser?.id])

  if (!sajuResult) {
    navigate('/')
    return null
  }

  const { fourPillars, fiveElements, categories, luckyColor, luckyNumber, overallReading } =
    sajuResult
  const hasFullReading = unlocked.fullReading ?? false

  const categoryKeys = ['wealth', 'love', 'career', 'health'] as const
  const categoryEmojis = { wealth: '💰', love: '❤️', career: '💼', health: '🏥' }

  return (
    <div className="min-h-screen gradient-mystic pb-24">
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-8">
          {t('result.title')}
        </h1>

        {/* Four Pillars - FREE */}
        <div className="bg-[var(--color-secondary)] rounded-2xl p-4 mb-6">
          <h2 className="text-sm text-[var(--color-text-muted)] mb-3">
            {t('result.fourPillars')}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {(['year', 'month', 'day', 'hour'] as const).map((k) => {
              const p = fourPillars[k]
              const isHourUnknown = k === 'hour' && !p
              const stemEl = p?.element ? ELEMENT_COLORS[p.element] : ''
              return (
                <div
                  key={k}
                  className={`rounded-xl p-3 text-center ${p?.element ? ELEMENT_BG[p.element] : 'bg-[var(--color-tertiary)]'}`}
                >
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">
                    {t(`result.${k}Pillar`)}
                  </p>
                  {isHourUnknown ? (
                    <p className="text-lg text-[var(--color-text-muted)]">
                      {t('result.unknown')}
                    </p>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">
                        <span className={stemEl}>{p?.heavenlyStem}</span>
                        <span className={p?.earthlyBranch ? (ELEMENT_COLORS[BRANCH_ELEMENT[p.earthlyBranch]] ?? 'text-white') : ''}>{p?.earthlyBranch}</span>
                      </p>
                      {p?.element && (
                        <p className="text-xs mt-1 opacity-80">
                          {ELEMENT_ICONS[p.element]} {t(`result.${p.element}`)}
                        </p>
                      )}
                    </>
                  )}
                  {!isHourUnknown && p && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {p.heavenlyStemEnglish ?? ''} / {p.earthlyBranchEnglish ?? ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Day Master - FREE */}
        <div className="bg-[var(--color-accent)]/20 rounded-2xl p-4 mb-6 border border-[var(--color-accent)]/40">
          <h2 className="text-xs text-[var(--color-accent)] font-medium mb-1">
            {t('result.dayMaster')}
          </h2>
          <p className="text-xl font-bold text-[var(--color-accent)]">
            {sajuResult.dayMaster}
            {sajuResult.dayMaster && (STEM_EN[sajuResult.dayMaster] ? ` (${STEM_EN[sajuResult.dayMaster]})` : '')}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {t('result.dayMasterDesc')}
          </p>
        </div>

        {/* Five Elements - FREE */}
        <div className="bg-[var(--color-secondary)] rounded-2xl p-4 mb-6">
          <h2 className="text-sm text-[var(--color-text-muted)] mb-3">
            {t('result.fiveElements')}
          </h2>
          <div className="space-y-2">
            {(['wood', 'fire', 'earth', 'metal', 'water'] as const).map((el) => {
              const pct = fiveElements[el] ?? 0
              return (
                <div key={el}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={ELEMENT_COLORS[el]}>{t(`result.${el}`)}</span>
                    <span className="text-[var(--color-text-muted)]">{pct}%</span>
                  </div>
                  <div className="h-2 bg-[var(--color-tertiary)] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        el === 'wood'
                          ? 'bg-green-500'
                          : el === 'fire'
                            ? 'bg-red-500'
                            : el === 'earth'
                              ? 'bg-yellow-400'
                              : el === 'metal'
                                ? 'bg-white'
                                : 'bg-slate-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Overall Reading - FREE */}
        <p className="text-[var(--color-text-muted)] text-sm mb-6 leading-relaxed">
          {overallReading}
        </p>

        {/* Categories with Blur Paywall */}
        <div className="space-y-2 mb-6">
          {categoryKeys.map((key) => {
            const cat = categories[key]
            const score = cat?.score ?? 0
            const detailText = cat?.detail || cat?.text || ''
            const isUnlocked = hasFullReading
            
            return (
              <div
                key={key}
                className="bg-[var(--color-secondary)] rounded-xl overflow-hidden relative"
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <span>{categoryEmojis[key]}</span>
                      <span>{t(`result.${key}`)}</span>
                    </span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={i <= score ? 'text-[var(--color-accent)]' : 'text-[var(--color-tertiary)]'}
                        >
                          ★
                        </span>
                      ))}
                    </span>
                  </div>
                  
                  {/* Detail text with blur effect */}
                  {detailText && (
                    <div className="relative">
                      <div className={`text-sm text-[var(--color-text-muted)] ${isUnlocked ? '' : 'blur-sm opacity-60'}`}>
                        {detailText}
                      </div>
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs text-[var(--color-accent)]">🔒</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Lucky Color & Number - FREE */}
        <div className="flex gap-4 justify-center mb-6">
          <div className="bg-[var(--color-secondary)] rounded-xl px-4 py-3">
            <p className="text-xs text-[var(--color-text-muted)]">{t('result.luckyColor')}</p>
            <p className="font-medium">{luckyColor}</p>
          </div>
          <div className="bg-[var(--color-secondary)] rounded-xl px-4 py-3">
            <p className="text-xs text-[var(--color-text-muted)]">{t('result.luckyNumber')}</p>
            <p className="font-medium">{luckyNumber}</p>
          </div>
        </div>

        {/* Premium Products Cards */}
        <div className="space-y-3 mb-6">
          {/* Card 1: Full Reading */}
          <ProductCard
            emoji="📖"
            title="Full Reading"
            price={150}
            priceUsd="≈ $3"
            description="Unlock detailed fortune analysis for Wealth, Love, Career & Health + 2025 yearly forecast"
            buttonText="Unlock Full Reading"
            product="full_reading"
            telegramUser={telegramUser}
            onSuccess={() => {
              setUnlocked({ ...unlocked, fullReading: true })
              // Refresh page to show unlocked content
              window.location.reload()
            }}
          />

          {/* Card 2: Personal Talisman */}
          <ProductCard
            emoji="🔮"
            title="Personal Talisman"
            price={250}
            priceUsd="≈ $5"
            description="AI-generated talisman based on YOUR Four Pillars & Five Elements"
            buttonText="Get My Talisman"
            product="personal_talisman"
            telegramUser={telegramUser}
            onSuccess={() => {
              navigate('/talisman/result?paid=1')
            }}
            borderStyle="gradient"
          />

          {/* Card 3: Premium Bundle - MOST PROMINENT */}
          <div className="relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                BEST VALUE
              </span>
            </div>
            <ProductCard
              emoji="✨"
              title="Premium Bundle"
              price={350}
              priceUsd="≈ $7"
              originalPrice={400}
              description="Full Reading + Personal Talisman — Save 50⭐"
              buttonText="Get Premium Bundle"
              product="premium_bundle"
              telegramUser={telegramUser}
              onSuccess={() => {
                setUnlocked({ fullReading: true, talisman: true })
                navigate('/talisman/result?paid=1')
              }}
              borderStyle="gold"
              highlight
            />
          </div>
        </div>

        {/* Premium Content (if unlocked) */}
        {hasFullReading && sajuResult.yearlyFortune && (
          <div className="bg-[var(--color-secondary)] rounded-2xl p-4 mb-6">
            <h2 className="text-sm text-[var(--color-accent)] font-medium mb-2">Yearly Fortune 2025</h2>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">
              {sajuResult.yearlyFortune}
            </p>
          </div>
        )}

        {hasFullReading && sajuResult.bestMonths && sajuResult.bestMonths.length > 0 && (
          <div className="bg-[var(--color-secondary)] rounded-2xl p-4 mb-6">
            <h2 className="text-sm text-[var(--color-accent)] font-medium mb-2">Best Months</h2>
            <div className="space-y-2">
              {sajuResult.bestMonths.map((m, i) => (
                <div key={i} className="text-sm text-[var(--color-text-muted)]">
                  <span className="font-medium">{m.month}</span>: {m.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasFullReading && sajuResult.cautionMonths && sajuResult.cautionMonths.length > 0 && (
          <div className="bg-[var(--color-secondary)] rounded-2xl p-4 mb-6">
            <h2 className="text-sm text-[var(--color-accent)] font-medium mb-2">Watch Out</h2>
            <div className="space-y-2">
              {sajuResult.cautionMonths.map((m, i) => (
                <div key={i} className="text-sm text-[var(--color-text-muted)]">
                  <span className="font-medium">{m.month}</span>: {m.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Button */}
        <ResultShareButton sajuResult={sajuResult} />

        {/* Cross-promotion Banners */}
        <div className="space-y-2 mt-6">
          <CrossPromoBanner
            emoji="🌙"
            text="What did you dream last night? Try @ONEIRO83Bot"
            link="https://t.me/ONEIRO83Bot?start=ONEIRO-7562751214"
          />
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  emoji,
  title,
  price,
  priceUsd,
  originalPrice,
  description,
  buttonText,
  product,
  telegramUser,
  onSuccess,
  borderStyle = 'normal',
  highlight = false,
}: {
  emoji: string
  title: string
  price: number
  priceUsd: string
  originalPrice?: number
  description: string
  buttonText: string
  product: string
  telegramUser: { id: number } | null
  onSuccess: () => void
  borderStyle?: 'normal' | 'gradient' | 'gold'
  highlight?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleBuy = async () => {
    const effectiveUser = telegramUser ?? getTelegramUserFromWebApp()
    if (!effectiveUser?.id) {
      setErr('Open from Telegram to purchase.')
      return
    }
    
    const { openInvoiceUrl } = await import('@/lib/telegram')
    
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/payment?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUserId: effectiveUser.id, product }),
      })
      const data = await res.json() as { invoiceLink?: string; error?: string }
      console.log('ProductCard: Invoice response:', data)
      if (!data.invoiceLink) {
        setErr(data.error ?? 'Failed')
        setLoading(false)
        return
      }
      
      console.log('ProductCard: Opening invoice:', data.invoiceLink)
      
      const paymentStatus = await openInvoiceUrl(data.invoiceLink)
      console.log('ProductCard: Payment status:', paymentStatus)
      
      if (paymentStatus === 'paid') {
          // Payment successful - but webhook might not have arrived yet
          // Poll database to confirm payment was processed
          // Note: We poll by user_id + product since charge_id isn't available until webhook arrives
          let attempts = 0
          const maxAttempts = 10
          const pollInterval = 1000 // 1 second
          
          const pollPayment = async (): Promise<void> => {
            try {
              // Check if payment exists in DB (webhook has processed it)
              // We check by user_id + product since charge_id isn't available yet
              const checkRes = await fetch('/api/payment?action=check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  telegram_user_id: effectiveUser.id,
                  product,
                }),
              })
              
              const checkData = await checkRes.json() as { paid?: boolean; status?: string }
              
              if (checkData.paid) {
                // Payment confirmed in database - webhook has processed it
                onSuccess()
                return
              }
              
              if (attempts < maxAttempts) {
                attempts++
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                return pollPayment()
              }
              
              // Max attempts reached - still call onSuccess as payment was confirmed by Telegram
              // Webhook will process it eventually and unlock features
              console.warn('Payment confirmed by Telegram but not yet in database. Webhook will process it.')
              onSuccess()
            } catch (e) {
              console.error('Error polling payment status:', e)
              // Still call onSuccess as Telegram confirmed payment
              // Webhook will process it eventually
              onSuccess()
            }
          }
          
          // Start polling
          await pollPayment()
      } else {
        setLoading(false)
        if (paymentStatus === 'failed') {
          setErr('결제 창을 열 수 없습니다. Telegram 앱을 최신 버전으로 업데이트하거나, 휴대폰 Telegram에서 시도해 보세요.')
        } else if (paymentStatus === 'cancelled') {
          setErr('결제가 취소되었습니다.')
        } else {
          setErr('결제에 실패했습니다.')
        }
      }
    } catch (e) {
      setErr((e as Error).message)
      setLoading(false)
    }
  }

  const borderClass =
    borderStyle === 'gradient'
      ? 'border-2 border-transparent bg-gradient-to-r from-yellow-400/50 to-orange-500/50 p-[2px] rounded-xl'
      : borderStyle === 'gold'
        ? highlight
          ? 'bg-gradient-to-br from-yellow-400/30 to-orange-500/30 border-2 border-yellow-400/60'
          : 'border-2 border-yellow-400/40'
        : 'border border-[var(--color-accent)]/40'

  return (
    <div className={`rounded-xl ${borderClass} ${highlight ? 'p-4' : 'p-[2px]'}`}>
      <div className={`bg-[var(--color-secondary)] rounded-xl ${highlight ? '' : 'p-4'}`}>
        {err && <p className="text-red-400 text-xs mb-2 text-center">{err}</p>}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{emoji}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--color-accent)] mb-1">{title}</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-lg font-bold text-[var(--color-accent)]">
                ⭐ {price} Stars
              </span>
              {originalPrice && (
                <>
                  <span className="text-xs text-[var(--color-text-muted)] line-through">
                    {originalPrice} Stars
                  </span>
                  <span className="text-xs text-green-400 font-medium">Save 50⭐!</span>
                </>
              )}
              <span className="text-xs text-[var(--color-text-muted)]">{priceUsd}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleBuy}
          disabled={loading}
          className="w-full py-3 rounded-full gradient-gold text-black font-semibold disabled:opacity-50"
        >
          {loading ? 'Loading...' : buttonText}
        </button>
      </div>
    </div>
  )
}

function CrossPromoBanner({ emoji, text, link }: { emoji: string; text: string; link: string }) {
  const handleClick = () => {
    const tg = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram?.WebApp
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(link)
    } else {
      window.open(link, '_blank')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full bg-[var(--color-secondary)] border border-[var(--color-accent)]/10 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-[var(--color-tertiary)] transition-colors"
    >
      <span className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <span>{emoji}</span>
        <span>{text}</span>
      </span>
      <span className="text-xs text-[var(--color-accent)]">Try →</span>
    </button>
  )
}

function ResultShareButton({ sajuResult }: { sajuResult: { categories: { wealth?: { score?: number }; love?: { score?: number }; career?: { score?: number }; health?: { score?: number } }; overallReading?: string } }) {
  const handleShare = () => {
    const win = window as unknown as {
      Telegram?: { WebApp?: { switchInlineQuery?: (query: string) => void; openTelegramLink?: (url: string) => void } }
    }
    
    const wealthStars = '⭐'.repeat(sajuResult.categories.wealth?.score ?? 0) + '☆'.repeat(5 - (sajuResult.categories.wealth?.score ?? 0))
    const loveStars = '⭐'.repeat(sajuResult.categories.love?.score ?? 0) + '☆'.repeat(5 - (sajuResult.categories.love?.score ?? 0))
    const careerStars = '⭐'.repeat(sajuResult.categories.career?.score ?? 0) + '☆'.repeat(5 - (sajuResult.categories.career?.score ?? 0))
    const healthStars = '⭐'.repeat(sajuResult.categories.health?.score ?? 0) + '☆'.repeat(5 - (sajuResult.categories.health?.score ?? 0))
    
    const essence = sajuResult.overallReading?.split('.')[0] || 'Your destiny awaits'
    
    const shareText = `🔮 My Saju Fortune says:
✨ ${essence}
💰 Wealth: ${wealthStars}
❤️ Love: ${loveStars}
📈 Career: ${careerStars}
🏥 Health: ${healthStars}

Get your FREE Saju reading → @KismetBot
What's YOUR destiny? 🔮`

    const botLink = 'https://t.me/kismet_saju_bot'
    
    if (win.Telegram?.WebApp?.switchInlineQuery) {
      win.Telegram.WebApp.switchInlineQuery(shareText)
    } else if (win.Telegram?.WebApp?.openTelegramLink) {
      win.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(shareText)}`)
    } else {
      navigator.clipboard?.writeText(shareText).then(() => alert('Share text copied!'))
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full py-3 rounded-full border-2 border-[var(--color-accent)] text-[var(--color-accent)] font-medium hover:bg-[var(--color-accent)]/10 transition-colors mb-3"
    >
      Share with Friends
    </button>
  )
}
