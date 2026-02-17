# 사주 팔자(간지) 계산 방식

## 📚 사용하는 라이브러리

### **`lunar-javascript`** 라이브러리 사용

- **패키지**: `lunar-javascript` (v1.7.7)
- **위치**: `src/lib/bazi.ts`
- **용도**: 태양력/음력 변환 및 사주 팔자(간지) 계산

---

## 🔍 계산 방식

### 1. 프론트엔드 (클라이언트 사이드)

**파일**: `src/lib/bazi.ts`

```typescript
import { Solar, Lunar } from 'lunar-javascript'

export function calculateBazi(
  birthDate: string,
  birthTime: string | null,
  calendarType: 'solar' | 'lunar'
) {
  // 1. 태양력/음력 변환
  if (calendarType === 'lunar') {
    const lunarObj = Lunar.fromYmdHms(y, m, d, hour, minute, 0)
    solar = lunarObj.getSolar()
  } else {
    solar = Solar.fromYmdHms(y, m, d, hour, minute, 0)
  }

  // 2. 사주 팔자 계산
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  // 3. Year/Month/Day/Hour Pillar 추출
  const yearP = parsePillar(eightChar.getYear())    // 예: 甲子
  const monthP = parsePillar(eightChar.getMonth())  // 예: 丙寅
  const dayP = parsePillar(eightChar.getDay())      // 예: 戊午
  const timeP = birthTime ? parsePillar(eightChar.getTime()) : null  // 예: 庚申

  // 4. 오행 계산
  const fiveElements = computeFiveElements(pillars)

  return { fourPillars, fiveElements, dayMaster }
}
```

---

### 2. 백엔드 (Supabase Edge Function)

**파일**: `supabase/functions/calculate-saju/index.ts`

자체 계산 로직 사용:
- `getYearPillar(year)` - 년주 계산
- `getMonthPillar(year, month)` - 월주 계산
- `getDayPillar(date)` - 일주 계산
- `getHourPillar(dayGan, hour, lmtOffset)` - 시주 계산

---

## 📋 GPT에 전달하는 데이터

GPT에게는 **날짜가 아닌 계산된 간지**를 전달합니다:

### 예시:
```javascript
{
  fourPillars: {
    year: { heavenlyStem: '甲', earthlyBranch: '子', element: 'wood' },
    month: { heavenlyStem: '丙', earthlyBranch: '寅', element: 'fire' },
    day: { heavenlyStem: '戊', earthlyBranch: '午', element: 'fire' },
    hour: { heavenlyStem: '庚', earthlyBranch: '申', element: 'metal' }
  },
  fiveElements: { wood: 25, fire: 50, earth: 0, metal: 25, water: 0 },
  dayMaster: '戊'
}
```

이 데이터를 텍스트로 변환해서 GPT 프롬프트에 포함시킵니다.

---

## ✅ 요약

1. **라이브러리**: `lunar-javascript` 사용
2. **계산 방식**: 라이브러리로 간지(Year/Month/Day/Hour Pillar) 직접 계산
3. **GPT 전달**: 계산된 간지 데이터를 텍스트로 변환해서 전달
4. **GPT 역할**: 간지 해석 및 리포트 생성 (간지 계산은 하지 않음)

---

## 🔧 새 앱에서 사용하려면

### 1. 라이브러리 설치:
```bash
npm install lunar-javascript
```

### 2. 코드 참조:
- `src/lib/bazi.ts` 파일의 `calculateBazi` 함수 참고
- 또는 `supabase/functions/calculate-saju/index.ts`의 자체 계산 로직 참고

---

## 💡 장점

- ✅ 정확한 간지 계산 (라이브러리 사용)
- ✅ 태양력/음력 모두 지원
- ✅ GPT 비용 절감 (간지 계산은 로컬에서)
- ✅ 빠른 응답 속도 (GPT API 호출 전에 계산 완료)
