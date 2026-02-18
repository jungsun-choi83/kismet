/**
 * Four Pillars (Bazi) calculation for Vercel API - no Edge Function dependency.
 * Uses lunar-javascript for accurate solar/lunar conversion.
 */
import { Solar, Lunar } from 'lunar-javascript'

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

export interface FiveElements {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}

const STEM_EN: Record<string, string> = {
  甲: 'Jia', 乙: 'Yi', 丙: 'Bing', 丁: 'Ding', 戊: 'Wu',
  己: 'Ji', 庚: 'Geng', 辛: 'Xin', 壬: 'Ren', 癸: 'Gui',
}
const BRANCH_EN: Record<string, string> = {
  子: 'Rat', 丑: 'Ox', 寅: 'Tiger', 卯: 'Rabbit', 辰: 'Dragon', 巳: 'Snake',
  午: 'Horse', 未: 'Goat', 申: 'Monkey', 酉: 'Rooster', 戌: 'Dog', 亥: 'Pig',
}
const STEM_ELEMENT: Record<string, string> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
}
const BRANCH_ELEMENT: Record<string, string> = {
  寅: 'wood', 卯: 'wood', 巳: 'fire', 午: 'fire', 辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth',
  申: 'metal', 酉: 'metal', 亥: 'water', 子: 'water',
}

const HIDDEN_STEMS: Record<string, Array<{ stem: string; element: string; weight: number }>> = {
  子: [{ stem: '癸', element: 'water', weight: 1.0 }],
  丑: [{ stem: '己', element: 'earth', weight: 0.7 }, { stem: '辛', element: 'metal', weight: 0.2 }, { stem: '癸', element: 'water', weight: 0.1 }],
  寅: [{ stem: '甲', element: 'wood', weight: 0.7 }, { stem: '丙', element: 'fire', weight: 0.2 }, { stem: '戊', element: 'earth', weight: 0.1 }],
  卯: [{ stem: '乙', element: 'wood', weight: 1.0 }],
  辰: [{ stem: '戊', element: 'earth', weight: 0.7 }, { stem: '乙', element: 'wood', weight: 0.2 }, { stem: '癸', element: 'water', weight: 0.1 }],
  巳: [{ stem: '丙', element: 'fire', weight: 0.7 }, { stem: '庚', element: 'metal', weight: 0.2 }, { stem: '戊', element: 'earth', weight: 0.1 }],
  午: [{ stem: '丁', element: 'fire', weight: 0.7 }, { stem: '己', element: 'earth', weight: 0.3 }],
  未: [{ stem: '己', element: 'earth', weight: 0.7 }, { stem: '丁', element: 'fire', weight: 0.2 }, { stem: '乙', element: 'wood', weight: 0.1 }],
  申: [{ stem: '庚', element: 'metal', weight: 0.7 }, { stem: '壬', element: 'water', weight: 0.2 }, { stem: '戊', element: 'earth', weight: 0.1 }],
  酉: [{ stem: '辛', element: 'metal', weight: 1.0 }],
  戌: [{ stem: '戊', element: 'earth', weight: 0.7 }, { stem: '辛', element: 'metal', weight: 0.2 }, { stem: '丁', element: 'fire', weight: 0.1 }],
  亥: [{ stem: '壬', element: 'water', weight: 0.7 }, { stem: '甲', element: 'wood', weight: 0.3 }],
}

function parsePillar(gz: string): Pillar | null {
  if (!gz || gz.length < 2) return null
  const stem = gz[0]
  const branch = gz[1]
  const element = STEM_ELEMENT[stem] ?? BRANCH_ELEMENT[branch]
  return {
    heavenlyStem: stem,
    earthlyBranch: branch,
    heavenlyStemEnglish: STEM_EN[stem],
    earthlyBranchEnglish: BRANCH_EN[branch],
    element: element ?? 'earth',
  }
}

function computeFiveElements(pillars: (Pillar | null)[]): FiveElements {
  const counts: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  for (const p of pillars) {
    if (p?.element) counts[p.element] = (counts[p.element] ?? 0) + 1.0
  }
  for (const p of pillars) {
    if (p?.earthlyBranch) {
      const hidden = HIDDEN_STEMS[p.earthlyBranch]
      if (hidden) {
        for (const h of hidden) counts[h.element] = (counts[h.element] ?? 0) + h.weight
      }
    }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return {
    wood: Math.round(((counts.wood ?? 0) / total) * 100),
    fire: Math.round(((counts.fire ?? 0) / total) * 100),
    earth: Math.round(((counts.earth ?? 0) / total) * 100),
    metal: Math.round(((counts.metal ?? 0) / total) * 100),
    water: Math.round(((counts.water ?? 0) / total) * 100),
  }
}

export function calculateBazi(
  birthDate: string,
  birthTime: string | null,
  calendarType: 'solar' | 'lunar'
): { fourPillars: FourPillars; fiveElements: FiveElements; dayMaster: string } {
  const [y, m, d] = birthDate.split('-').map(Number)
  let hour = 12
  let minute = 0
  if (birthTime) {
    const [h, min] = birthTime.split(':').map(Number)
    hour = h
    minute = min ?? 0
  }

  let solar
  if (calendarType === 'lunar') {
    const lunarObj = Lunar.fromYmdHms(y, m, d, hour, minute, 0)
    solar = lunarObj.getSolar()
  } else {
    solar = Solar.fromYmdHms(y, m, d, hour, minute, 0)
  }

  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  const yearP = parsePillar(eightChar.getYear())
  const monthP = parsePillar(eightChar.getMonth())
  const dayP = parsePillar(eightChar.getDay())
  const timeP = birthTime ? parsePillar(eightChar.getTime()) : null

  const pillars = [yearP, monthP, dayP, timeP].filter(Boolean)
  const fiveElements = computeFiveElements(pillars as Pillar[])

  const fourPillars: FourPillars = {
    year: yearP!,
    month: monthP!,
    day: dayP!,
    hour: timeP,
  }

  const dayMaster = dayP?.heavenlyStem ?? ''
  return { fourPillars, fiveElements, dayMaster }
}
