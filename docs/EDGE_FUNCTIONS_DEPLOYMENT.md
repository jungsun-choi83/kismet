# ⚠️ Edge Functions 배포 필요

## 문제
"Failed to send a request to the Edge Function" 에러가 발생합니다.

## 원인
다음 Edge Functions가 Supabase에 배포되지 않았습니다:
- `calculate-saju` (사주 계산)
- `generate-talisman` (부적 생성)
- `daily-fortune` (일일 운세)
- `create-invoice` (결제 링크 생성)

## 해결 방법

### 1. calculate-saju 함수 배포

1. Supabase 대시보드 → **Edge Functions** 메뉴
2. **"Deploy a new function"** 또는 **"Via Editor"** 클릭
3. 함수 이름: `calculate-saju`
4. Cursor에서 `supabase/functions/calculate-saju/index.ts` 파일 열기
5. 전체 내용 복사 → Supabase Editor에 붙여넣기
6. **"Deploy function"** 클릭

### 2. generate-talisman 함수 배포

1. 같은 방법으로 함수 생성
2. 함수 이름: `generate-talisman`
3. `supabase/functions/generate-talisman/index.ts` 내용 복사
4. 배포

### 3. daily-fortune 함수 배포

1. 함수 이름: `daily-fortune`
2. `supabase/functions/daily-fortune/index.ts` 내용 복사
3. 배포

### 4. create-invoice 함수 배포 (선택사항)

- 이 함수는 Vercel API로 대체 가능하지만, Supabase에서도 사용 가능합니다.
- 함수 이름: `create-invoice`
- `supabase/functions/create-invoice/index.ts` 내용 복사
- 배포

## 배포 후 확인

모든 함수가 배포되면:
1. Edge Functions 목록에 4개 함수가 보이는지 확인
2. 각 함수의 "Deployments"가 1 이상인지 확인
3. 텔레그램 앱에서 다시 테스트

## 빠른 배포 순서

1. ✅ telegram-webhook (이미 배포됨)
2. ⚠️ calculate-saju (필수)
3. ⚠️ generate-talisman (필수)
4. ⚠️ daily-fortune (필수)
5. ⚠️ create-invoice (선택)

## 중요

각 함수 배포 후 환경 변수(Secrets)도 확인하세요:
- `BOT_TOKEN` 또는 `TELEGRAM_BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FULFILL_PAYMENT_URL`
- `MINI_APP_URL`
