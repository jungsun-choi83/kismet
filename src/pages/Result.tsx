import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { STEM_EN, BRANCH_ELEMENT } from '@/lib/bazi'

const ELEMENT_COLORS: Record<string, string> = {
  wood: 'text-green-400',
  fire: 'text-red-400',
  earth: 'text-yellow-400',
  metal: 'text-amber-600',
  water: 'text-blue-400',
}
const ELEMENT_BG: Record<string, string> = {
  wood: 'bg-green-400/20',
  fire: 'bg-red-400/20',
  earth: 'bg-yellow-400/20',
  metal: 'bg-amber-600/20',
  water: 'bg-blue-400/20',
}
const ELEMENT_ICONS: Record<string, string> = {
  wood: '🌳',
  fire: '🔥',
  earth: '⛰️',
  metal: '⚙️',
  water: '💧',
}

export default function Result() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sajuResult = useAppStore((s) => s.sajuResult)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!sajuResult) {
    navigate('/')
    return null
  }

  const { fourPillars, fiveElements, categories, luckyColor, luckyNumber, overallReading } =
    sajuResult

  const categoryKeys = ['wealth', 'love', 'career', 'health'] as const
  const categoryEmojis = { wealth: '💰', love: '❤️', career: '💼', health: '🏥' }

  return (
    <div className="min-h-screen gradient-mystic pb-24">
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-8">
          {t('result.title')}
        </h1>

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
                          ? 'bg-green-400'
                          : el === 'fire'
                            ? 'bg-red-400'
                            : el === 'earth'
                              ? 'bg-yellow-400'
                              : el === 'metal'
                                ? 'bg-amber-700'
                                : 'bg-blue-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-[var(--color-text-muted)] text-sm mb-6 leading-relaxed">
          {overallReading}
        </p>

        <div className="space-y-2 mb-6">
          {categoryKeys.map((key) => {
            const cat = categories[key]
            const score = cat?.score ?? 0
            const isOpen = expanded === key
            return (
              <div
                key={key}
                className="bg-[var(--color-secondary)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
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
                </button>
                {isOpen && cat?.text && (
                  <div className="px-4 pb-4 pt-0 text-sm text-[var(--color-text-muted)] border-t border-[var(--color-tertiary)]">
                    {cat.text}
                  </div>
                )}
              </div>
            )
          })}
        </div>

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

        <button
          onClick={() => navigate('/talisman')}
          className="w-full py-4 rounded-full gradient-gold text-black font-semibold"
        >
          {t('result.getTalisman')}
        </button>
      </div>
    </div>
  )
}
