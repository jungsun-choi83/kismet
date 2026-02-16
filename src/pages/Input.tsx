import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { searchPlaces, type GeoapifyPlace } from '@/hooks/useGeoapify'

export default function Input() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { updateUserInput, setUserInput } = useAppStore()
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState<string | null>(null)
  const [birthCity, setBirthCity] = useState('')
  const [birthCityData, setBirthCityData] = useState<{
    latitude: number
    longitude: number
    timezoneName: string
    timezoneOffset: number
  } | null>(null)
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar')
  const [citySuggestions, setCitySuggestions] = useState<GeoapifyPlace[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [timeUnknown, setTimeUnknown] = useState(false)

  const isValidDate = (dateStr: string): boolean => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return false
    const [y, m, day] = dateStr.split('-').map(Number)
    return d.getUTCFullYear() === y && d.getUTCMonth() + 1 === m && d.getUTCDate() === day
  }

  const canSubmit = birthDate && gender && isValidDate(birthDate)

  const handleCityChange = useCallback(async (value: string) => {
    setBirthCity(value)
    if (!value.trim()) {
      setCitySuggestions([])
      setBirthCityData(null)
      return
    }
    const places = await searchPlaces(value)
    setCitySuggestions(places)
    setShowCitySuggestions(true)
  }, [])

  const selectCity = (place: GeoapifyPlace) => {
    const p = place.properties
    const name = p.city ?? p.name
    setBirthCity(name)
    setBirthCityData({
      latitude: p.lat,
      longitude: p.lon,
      timezoneName: p.timezone?.name ?? '',
      timezoneOffset: (p.timezone?.offset_STD_seconds ?? 0) / 60,
    })
    setShowCitySuggestions(false)
  }

  const handleSubmit = () => {
    if (!canSubmit || !isValidDate(birthDate)) return
    const input = {
      birthDate,
      birthTime: timeUnknown ? null : (birthTime ?? null),
      gender,
      calendarType,
      birthCity: birthCity.trim() || null,
      latitude: birthCityData?.latitude ?? null,
      longitude: birthCityData?.longitude ?? null,
      timezoneOffset: birthCityData?.timezoneOffset ?? null,
      timezoneName: birthCityData?.timezoneName ?? null,
    }
    setUserInput(input)
    updateUserInput(input)
    navigate('/loading')
  }

  const today = new Date().toISOString().split('T')[0]
  const minDate = '1940-01-01'

  return (
    <div className="min-h-screen gradient-mystic px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold text-[var(--color-accent)] text-center mb-2">
          {t('app.title')}
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm text-center mb-8">
          {t('onboarding.subtitle')}
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('onboarding.birthDate')} *
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              min={minDate}
              max={today}
              className="w-full bg-[var(--color-tertiary)] rounded-xl px-4 py-3 text-white border border-transparent focus:border-[var(--color-accent)] focus:outline-none transition-colors"
            />
            {birthDate && !isValidDate(birthDate) && (
              <p className="text-red-400 text-sm mt-1">{t('onboarding.birthDateInvalid')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('onboarding.birthTime')}
            </label>
            <div className="flex gap-2 flex-wrap">
              <input
                type="time"
                value={birthTime ?? ''}
                onChange={(e) => setBirthTime(e.target.value)}
                disabled={timeUnknown}
                className="flex-1 min-w-[120px] bg-[var(--color-tertiary)] rounded-xl px-4 py-3 text-white border border-transparent focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
              />
              <label className="flex items-center gap-2 px-4 py-3 bg-[var(--color-tertiary)] rounded-xl cursor-pointer hover:opacity-90">
                <input
                  type="checkbox"
                  checked={timeUnknown}
                  onChange={(e) => {
                    setTimeUnknown(e.target.checked)
                    if (e.target.checked) setBirthTime(null)
                  }}
                />
                <span className="text-sm">{t('onboarding.birthTimeUnknown')}</span>
              </label>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('onboarding.birthCity')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={birthCity}
                onChange={(e) => handleCityChange(e.target.value)}
                onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                placeholder={t('onboarding.birthCityPlaceholder')}
                className="flex-1 bg-[var(--color-tertiary)] rounded-xl px-4 py-3 text-white border border-transparent focus:border-[var(--color-accent)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setBirthCity('')
                  setBirthCityData(null)
                }}
                className="px-4 py-3 bg-[var(--color-secondary)] rounded-xl text-[var(--color-text-muted)] text-sm hover:bg-[var(--color-tertiary)]"
              >
                {t('onboarding.birthCitySkip')}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('onboarding.birthCityHint')}</p>
            {showCitySuggestions && citySuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-[var(--color-secondary)] rounded-xl overflow-hidden border border-[var(--color-tertiary)]">
                {citySuggestions.map((place) => (
                  <li
                    key={place.properties.lat + place.properties.lon}
                    onClick={() => selectCity(place)}
                    className="px-4 py-3 hover:bg-[var(--color-tertiary)] cursor-pointer text-sm"
                  >
                    {place.properties.city ?? place.properties.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('onboarding.gender')} *
            </label>
            <div className="flex gap-2">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    gender === g
                      ? 'bg-[var(--color-accent)] text-black'
                      : 'bg-[var(--color-tertiary)] text-white hover:opacity-90'
                  }`}
                >
                  {t(`onboarding.gender${g.charAt(0).toUpperCase() + g.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              {t('onboarding.calendarType')}
            </label>
            <div className="flex gap-2 p-1 bg-[var(--color-tertiary)] rounded-xl">
              <button
                type="button"
                onClick={() => setCalendarType('solar')}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  calendarType === 'solar' ? 'bg-[var(--color-accent)] text-black' : 'text-white'
                }`}
              >
                {t('onboarding.calendarSolar')}
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('lunar')}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  calendarType === 'lunar' ? 'bg-[var(--color-accent)] text-black' : 'text-white'
                }`}
              >
                {t('onboarding.calendarLunar')}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full mt-10 py-4 rounded-full gradient-gold text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {t('onboarding.cta')}
        </button>
      </div>
    </div>
  )
}
