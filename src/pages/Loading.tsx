import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { callCalculateSaju } from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import { calculateBazi } from '@/lib/bazi'
import type { SajuResult } from '@/types'

const STEPS = ['loading.step1', 'loading.step2', 'loading.step3'] as const

function buildDemoSaju(userInput: { birthDate?: string; birthTime?: string | null; calendarType?: string }): SajuResult {
  const birthDate = userInput.birthDate ?? '2000-01-01'
  const { fourPillars, fiveElements, dayMaster } = calculateBazi(
    birthDate,
    userInput.birthTime ?? null,
    (userInput.calendarType as 'solar' | 'lunar') ?? 'solar'
  )
  return {
    fourPillars,
    fiveElements,
    dayMaster,
    overallReading: 'Your destiny is written in the stars. The Four Pillars reveal a unique path shaped by the elements. Embrace the balance of Wood, Fire, Earth, Metal, and Water within you.',
    categories: {
      wealth: { score: 4, text: 'Good fortune in wealth. Stay diligent and opportunities will come.' },
      love: { score: 4, text: 'Strong prospects in love. Be open to new connections.' },
      career: { score: 3, text: 'Steady career growth. Patience will reward you.' },
      health: { score: 5, text: 'Excellent health. Maintain your balance and vitality.' },
    },
    luckyColor: 'Gold',
    luckyNumber: 7,
  }
}

export default function Loading() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { userInput, telegramUser, setSajuResult } = useAppStore()
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % 3), 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 80))
    }, 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!userInput || !telegramUser) {
      navigate('/input')
      return
    }

    const saveSaju = (saju: SajuResult) => {
      fetch('/api/save-saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_user_id: telegramUser.id, saju_result: saju }),
      }).catch(() => {})
    }

    if (isDemoMode) {
      const timer = setTimeout(() => {
        setProgress(100)
        try {
          const saju = buildDemoSaju(userInput)
          setSajuResult(saju)
          saveSaju(saju)
        } catch {
          setError('Invalid date. Please check your birth details.')
          return
        }
        setTimeout(() => navigate('/result'), 500)
      }, 2500)
      return () => clearTimeout(timer)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    callCalculateSaju({
      ...userInput,
      telegramUserId: telegramUser.id,
    } as Parameters<typeof callCalculateSaju>[0])
      .then((data: unknown) => {
        clearTimeout(timeout)
        setProgress(100)
        const saju = data as SajuResult
        setSajuResult(saju)
        saveSaju(saju)
        setTimeout(() => navigate('/result'), 500)
      })
      .catch((err) => {
        clearTimeout(timeout)
        setError(err?.message ?? 'Failed to calculate')
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [userInput, telegramUser, setSajuResult, navigate])

  const retry = () => {
    setError(null)
    setProgress(0)
    window.location.reload()
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-mystic flex flex-col items-center justify-center px-6">
        <p className="text-red-400 mb-6">{error}</p>
        <button
          onClick={retry}
          className="px-8 py-3 rounded-full gradient-gold text-black font-semibold"
        >
          {t('loading.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mystic flex flex-col items-center justify-center px-6">
      <div className="animate-spin text-6xl text-[var(--color-accent)] mb-8">☯</div>
      <p className="text-lg text-[var(--color-text-muted)] mb-8">
        {t(STEPS[step])}
      </p>
      <div className="w-full max-w-xs h-2 bg-[var(--color-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full gradient-gold transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
