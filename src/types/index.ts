// User input
export interface UserInput {
  birthDate: string
  birthTime: string | null
  gender: 'male' | 'female' | 'other'
  calendarType: 'solar' | 'lunar'
  birthCity: string | null
  latitude: number | null
  longitude: number | null
  timezoneOffset: number | null
  timezoneName: string | null
}

// Telegram user
export interface TelegramUser {
  id: number
  username?: string
  languageCode?: string
}

// Four Pillars (四柱八字)
export interface Pillar {
  heavenlyStem: string
  earthlyBranch: string
  heavenlyStemEnglish?: string
  earthlyBranchEnglish?: string
  element?: string
}

export interface FourPillars {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar | null
}

// Five Elements
export interface FiveElements {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}

// Category score
export interface CategoryScore {
  score: number
  text: string
}

// Saju result
export interface SajuResult {
  fourPillars: FourPillars
  fiveElements: FiveElements
  overallReading: string
  categories: {
    wealth: CategoryScore
    love: CategoryScore
    career: CategoryScore
    health: CategoryScore
  }
  luckyColor: string
  luckyNumber: number
  dayMaster: string
}

// Talisman
export interface TalismanResult {
  imageUrl: string
  wish: string
  style: string
  guide: string
}

// Daily fortune
export interface DailyFortune {
  score: number
  summary: string
  wealth: number
  love: number
  career: number
  health: number
}
