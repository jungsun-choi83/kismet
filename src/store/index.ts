import { create } from 'zustand'
import type {
  UserInput,
  TelegramUser,
  SajuResult,
  TalismanResult,
  DailyFortune,
} from '@/types'

interface AppState {
  // User
  telegramUser: TelegramUser | null
  setTelegramUser: (user: TelegramUser | null) => void

  // User input (onboarding)
  userInput: Partial<UserInput> | null
  setUserInput: (input: Partial<UserInput> | null) => void
  updateUserInput: (partial: Partial<UserInput>) => void

  // Saju result
  sajuResult: SajuResult | null
  setSajuResult: (result: SajuResult | null) => void

  // Talisman selection & result
  talismanWish: string | null
  talismanStyle: string | null
  setTalismanSelection: (wish: string, style: string) => void
  talismanResult: TalismanResult | null
  setTalismanResult: (result: TalismanResult | null) => void

  // Daily fortune
  dailyFortune: DailyFortune | null
  setDailyFortune: (fortune: DailyFortune | null) => void

  // Free trial
  freeTrialUsed: boolean
  setFreeTrialUsed: (used: boolean) => void

  // User exists (for new vs returning)
  userExists: boolean | null
  setUserExists: (exists: boolean | null) => void

  // Reset
  reset: () => void
}

const initialState = {
  telegramUser: null,
  userInput: null,
  sajuResult: null,
  talismanWish: null,
  talismanStyle: null,
  talismanResult: null,
  dailyFortune: null,
  freeTrialUsed: false,
  userExists: null,
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setTelegramUser: (user) => set({ telegramUser: user }),

  setUserInput: (input) => set({ userInput: input }),
  updateUserInput: (partial) =>
    set((s) => ({ userInput: { ...s.userInput, ...partial } as Partial<UserInput> })),

  setSajuResult: (result) => set({ sajuResult: result }),

  setTalismanSelection: (wish, style) =>
    set({ talismanWish: wish, talismanStyle: style }),
  setTalismanResult: (result) => set({ talismanResult: result }),

  setDailyFortune: (fortune) => set({ dailyFortune: fortune }),

  setFreeTrialUsed: (used) => set({ freeTrialUsed: used }),

  setUserExists: (exists) => set({ userExists: exists }),

  reset: () => set(initialState),
}))
