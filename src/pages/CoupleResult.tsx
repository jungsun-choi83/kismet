import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'

const BOT_APP_LINK = 'https://t.me/kismet_saju_bot/app'

export default function CoupleResult() {
  const navigate = useNavigate()
  const telegramUser = useAppStore((s) => s.telegramUser)
  const [reportHtml, setReportHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
      fetch(`/api/data?type=couple&telegram_user_id=${telegramUser.id}`)
      .then((r) => r.json())
      .then((data: { report?: string }) => {
        if (data.report) setReportHtml(data.report)
        else setError('Report not found')
      })
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false))
  }, [telegramUser?.id, navigate])

  const handleShare = () => {
    const win = window as unknown as { Telegram?: { WebApp?: { switchInlineQuery?: (q: string) => void } } }
    const text = '💕 Check out our couple compatibility report! ' + BOT_APP_LINK
    if (win.Telegram?.WebApp?.switchInlineQuery) {
      win.Telegram.WebApp.switchInlineQuery(text)
    } else {
      navigator.clipboard?.writeText(text).then(() => alert('Link copied.'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-mystic flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 border-2 border-[var(--color-accent)]/50 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[var(--color-text-muted)]">Aligning with the Universe...</p>
      </div>
    )
  }

  if (error || !reportHtml) {
    return (
      <div className="min-h-screen gradient-mystic flex flex-col items-center justify-center px-6">
        <p className="text-red-400 mb-4">{error ?? 'Report not found'}</p>
        <button
          onClick={() => navigate('/result')}
          className="px-6 py-3 rounded-full gradient-gold text-black font-semibold"
        >
          Back to Result
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mystic pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-2">
          KISMET
        </h1>
        <p className="text-center text-[var(--color-text-muted)] text-sm mb-8">
          Couple Compatibility Analysis
        </p>

        <article
          className="bg-[var(--color-secondary)]/80 rounded-2xl p-6 md:p-8 text-[var(--color-text)] prose prose-invert prose-headings:text-[var(--color-accent)] prose-p:text-[var(--color-text)] prose-p:leading-relaxed prose-li:text-[var(--color-text)] max-w-none
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2
            [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-1
            [&_p]:text-sm [&_p]:mb-3
            [&_ul]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3"
          dangerouslySetInnerHTML={{ __html: reportHtml }}
        />

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-full border-2 border-[var(--color-accent)] text-[var(--color-accent)] font-medium"
          >
            Share with Friends
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
