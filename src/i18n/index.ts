import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import ar from './ar.json'
import ko from './ko.json'
import ja from './ja.json'
import es from './es.json'

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  ko: { translation: ko },
  ja: { translation: ja },
  es: { translation: es },
}

// Map Telegram language codes to our supported languages
const langCodeMap: Record<string, string> = {
  en: 'en',
  ar: 'ar',
  ko: 'ko',
  ja: 'ja',
  es: 'es',
  // Fallbacks for common variants
  'en-US': 'en',
  'en-GB': 'en',
  'pt': 'es', // Portuguese → Spanish fallback
  'zh': 'en',
  'zh-CN': 'en',
  'zh-TW': 'en',
  'ru': 'en',
  'de': 'en',
  'fr': 'en',
  'tr': 'en',
}

export function initI18n(telegramLangCode?: string) {
  const lang = telegramLangCode 
    ? (langCodeMap[telegramLangCode] ?? 'en') 
    : 'en'

  i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

  // RTL for Arabic
  const isRtl = lang === 'ar'
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
  document.documentElement.lang = lang

  return i18n
}

export default i18n
