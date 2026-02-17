# 🚀 배포 체크리스트

## 1. Vercel 리플로이 ✅

Vercel 대시보드에서 **"Redeploy"** 버튼 클릭하거나 자동 배포 대기

변경된 파일:
- `src/pages/Result.tsx` (프론트엔드)
- `api/create-invoice/index.ts` (API)
- `api/fulfill-payment/index.ts` (API)
- `api/check-payment/index.ts` (신규 API)

---

## 2. Supabase Edge Function 배포 ⚠️ 필수

### telegram-webhook 함수 배포

1. Supabase 대시보드 → **Edge Functions** 메뉴
2. `telegram-webhook` 함수 선택
3. **Deploy** 버튼 클릭

또는 CLI 사용:
```bash
supabase functions deploy telegram-webhook
```

변경된 파일:
- `supabase/functions/telegram-webhook/index.ts`

---

## 3. Supabase SQL 실행 ⚠️ 필수

### 3-1. 사용자 제한 테이블 추가

Supabase 대시보드 → **SQL Editor** → 다음 파일 실행:

**`docs/USER_LIMITS_TABLE.sql`** 실행

이 SQL은 다음 컬럼들을 `users` 테이블에 추가합니다:
- `free_readings_used` (무료 분석 사용 횟수)
- `daily_readings_count` (일일 분석 횟수)
- `daily_readings_date` (일일 분석 날짜)
- `daily_talisman_count` (일일 부적 생성 횟수)
- `daily_talisman_date` (일일 부적 날짜)
- `unlocked_full_reading` (Full Reading unlock 상태)
- `unlocked_talisman` (Talisman unlock 상태)

### 3-2. Payments 테이블 업데이트

**`docs/PAYMENTS_TABLE.sql`** 실행 (이미 실행했다면 스킵)

`status` 컬럼이 있는지 확인:
```sql
-- 이미 실행했다면 스킵
ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'completed';
```

---

## 4. 환경 변수 확인 ✅

### Vercel 환경 변수
- `TELEGRAM_BOT_TOKEN` ✅
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `MINI_APP_URL` ✅
- `OPENAI_API_KEY` ✅

### Supabase Edge Function 환경 변수
Supabase 대시보드 → **Edge Functions** → **Settings** → **Secrets**

다음 환경 변수 확인:
- `BOT_TOKEN` 또는 `TELEGRAM_BOT_TOKEN` ✅
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `FULFILL_PAYMENT_URL` ⚠️ **추가 필요**: `https://your-app.vercel.app/api/fulfill-payment`
- `MINI_APP_URL` ✅

---

## 5. 배포 후 테스트 ✅

### 테스트 순서:

1. **결제 플로우 테스트**
   - Full Reading (150 Stars) 구매
   - Personal Talisman (250 Stars) 구매
   - Premium Bundle (350 Stars) 구매

2. **제한 로직 테스트**
   - 무료 분석 3회 후 메시지 확인
   - 일일 분석 5회 후 제한 확인

3. **Webhook 테스트**
   - 결제 후 DB에 기록되는지 확인
   - unlock 상태가 업데이트되는지 확인

---

## 요약

| 작업 | 위치 | 필수 여부 |
|------|------|----------|
| Vercel 리플로이 | Vercel 대시보드 | ✅ 필수 |
| Supabase Edge Function 배포 | Supabase 대시보드 | ✅ 필수 |
| SQL 실행 (USER_LIMITS_TABLE.sql) | Supabase SQL Editor | ✅ 필수 |
| SQL 실행 (PAYMENTS_TABLE.sql) | Supabase SQL Editor | ⚠️ 확인 필요 |
| 환경 변수 확인 | Vercel + Supabase | ✅ 필수 |

---

## 빠른 배포 명령어 (CLI 사용 시)

```bash
# 1. Vercel 배포
vercel --prod

# 2. Supabase Edge Function 배포
supabase functions deploy telegram-webhook

# 3. SQL 실행은 Supabase 대시보드에서 수동 실행 필요
```
