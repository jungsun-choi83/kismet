# 🔮 KISMET 수익화 업데이트 완료

## ✅ 완료된 수정사항

### 1. 무료/유료 구분 재설계 ✅
- **무료 영역**: 사주팔자 4기둥, Day Master, Five Elements 차트, 운세 요약 한 줄, Lucky Color/Number, 별점만 표시
- **블러 처리**: Wealth, Love, Career, Health 상세 해석 텍스트는 블러 처리 (🔒 아이콘 표시)
- **유료 해제**: Full Reading 구매 시 블러 해제 및 프리미엄 콘텐츠 표시

### 2. 3개 상품 구성 ✅
- **Item A: Full Reading** (150 Stars ≈ $3)
  - 블러 해제: Wealth, Love, Career, Health 상세 해석
  - 추가: Yearly Fortune 2025, Best Months, Watch Out 섹션
  
- **Item B: Personal Talisman** (250 Stars ≈ $5)
  - 사주 기반 개인 맞춤 부적 이미지 생성
  - How to Use 가이드 포함
  
- **Item C: Premium Bundle** (350 Stars ≈ $7)
  - Full Reading + Personal Talisman 합본
  - "BEST VALUE" 뱃지, 50 Stars 할인 강조

### 3. 부적 스타일 변경 ✅
- **전통 동양 부적 스타일**: 노란 종이 + 빨간 잉크 (朱砂色)
- **추상적 mystical script**: 실제 한자 대신 장식적 브러시 스트로크 사용 (깨진 한자 방지)
- **카테고리별 상징 매핑**: Wealth(보배 만다라), Love(쌍학), Career(용), Health(거북) 등

### 4. 일일 사용 제한 ✅
- **무료 분석**: 계정당 3회 제한
- **일일 분석**: 유저당 하루 최대 5회 (무료+유료 합산)
- **일일 부적**: 유저당 하루 최대 3회
- 제한 초과 시 안내 메시지 표시

### 5. 오행 계산 정확도 개선 ✅
- **지장간(藏干) 포함**: 천간뿐만 아니라 지지의 숨겨진 천간도 오행 계산에 반영
- **가중치 적용**: 천간 1.0, 지장간 본기 0.7, 중기 0.2, 여기 0.1
- **정확도 향상**: 예시 (癸亥 丙辰 戊寅)에서 Wood 0% → 19%로 정확하게 계산

### 6. 교차 홍보 배너 ✅
- 결과 페이지 하단에 추가:
  - 🌙 @OneiroBot (꿈 해석)
  - ⚡ @SigilBot (타투 디자인)

### 7. 공유 메시지 최적화 ✅
- 별점 포함 동적 공유 메시지 생성
- 텔레그램 공유 API 활용

## 📋 데이터베이스 설정 필요

### 1. Supabase SQL 실행
다음 SQL 파일을 Supabase SQL Editor에서 실행하세요:

```sql
-- docs/USER_LIMITS_TABLE.sql 실행
-- 사용자 제한 및 unlock 상태 컬럼 추가
```

### 2. 사용자 테이블 컬럼 추가 확인
다음 컬럼들이 `users` 테이블에 있어야 합니다:
- `free_readings_used` (INTEGER, 기본값 0)
- `daily_readings_count` (INTEGER, 기본값 0)
- `daily_readings_date` (DATE)
- `daily_talisman_count` (INTEGER, 기본값 0)
- `daily_talisman_date` (DATE)
- `unlocked_full_reading` (BOOLEAN, 기본값 false)
- `unlocked_talisman` (BOOLEAN, 기본값 false)

## 🔧 주요 변경 파일

### 프론트엔드
- `src/pages/Result.tsx`: 블러 처리, 상품 카드, 교차 홍보 배너
- `src/types/index.ts`: 상세 해석 필드 추가 (detail, yearlyFortune, bestMonths, cautionMonths)
- `src/lib/bazi.ts`: 지장간 포함 오행 계산 로직

### 백엔드
- `api/create-invoice/index.ts`: 새 상품 가격 업데이트
- `api/fulfill-payment/index.ts`: 새 상품 처리 및 unlock 상태 업데이트
- `api/generate-talisman/index.ts`: 전통 부적 프롬프트로 변경
- `supabase/functions/calculate-saju/index.ts`: 상세 해석 필드 생성, 무료 3회 제한, 지장간 계산
- `supabase/functions/_shared/userLimits.ts`: 사용자 제한 체크 유틸리티 (신규)

### 데이터베이스
- `docs/USER_LIMITS_TABLE.sql`: 사용자 제한 테이블 스키마 (신규)

## 🚀 배포 후 확인사항

1. **결제 플로우 테스트**
   - Full Reading (150 Stars) 구매 → 블러 해제 확인
   - Personal Talisman (250 Stars) 구매 → 부적 생성 확인
   - Premium Bundle (350 Stars) 구매 → 두 기능 모두 unlock 확인

2. **제한 로직 테스트**
   - 무료 분석 3회 후 메시지 확인
   - 일일 분석 5회 후 제한 확인
   - 일일 부적 3회 후 제한 확인

3. **부적 스타일 확인**
   - 전통 동양 부적 스타일 (노란 종이 + 빨간 잉크)
   - 추상적 mystical script (깨진 한자 없음)

4. **오행 계산 확인**
   - 지장간이 포함된 정확한 오행 비율 계산

## 📝 참고사항

- 무료 사용자는 별점만 볼 수 있고, 상세 해석은 블러 처리됩니다
- Full Reading 구매 시 모든 프리미엄 콘텐츠가 해제됩니다
- Premium Bundle이 가장 좋은 가치를 제공하도록 강조되어 있습니다
- 부적은 전통 동양 스타일로 생성되어 신뢰도가 높아집니다
