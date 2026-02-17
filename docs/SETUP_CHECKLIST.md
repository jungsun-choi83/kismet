# KISMET 설정 체크리스트

## ✅ Vercel에 추가해야 할 환경 변수

Vercel 프로젝트 설정 → Environment Variables에서 다음을 추가하세요:

### 필수 (Backend API용)
```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
OPENAI_API_KEY=sk-...
MINI_APP_URL=https://your-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 선택사항 (Fulfill Payment URL)
```
FULFILL_PAYMENT_URL=https://your-app.vercel.app/api/fulfill-payment
```
(없으면 자동으로 `VERCEL_URL` 기반으로 생성됨)

---

## ✅ Supabase 설정

### 1. 데이터베이스 테이블 생성
Supabase SQL Editor에서 `docs/PAYMENTS_TABLE.sql` 실행:
- `payments` 테이블 (결제 로깅)
- `saju_cache` 테이블 (사주 캐시)
- `referrals` 테이블 (추천인 추적)
- `user_credits` 테이블 (무료 부적 크레딧)

### 2. RLS (Row Level Security)
- 모든 테이블에 RLS 활성화됨
- 서버(service_role)만 접근 가능하도록 설정됨

---

## ✅ Telegram Bot 설정

### 1. BotFather에서
1. `/newbot` - 봇 생성 (이미 있으면 스킵)
2. `/newapp` - Mini App 생성
   - App name: `KISMET`
   - Short name: `kismet`
   - Web App URL: `https://your-app.vercel.app`
   - Description: `Discover your destiny through Four Pillars of Destiny`

### 2. Webhook 설정
**중요**: Vercel API 라우트를 사용하는 경우:

```bash
# Vercel 배포 후 webhook 설정
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram-webhook"
```

또는 Supabase Edge Function을 사용하는 경우:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<your-project>.supabase.co/functions/v1/telegram-webhook"
```

### 3. Bot Commands (선택사항)
BotFather에서 `/setcommands`:
```
start - Start using KISMET
fortune - Get your daily fortune
talisman - Create a talisman
```

---

## ✅ 작동 확인 방법

### 1. 로컬 테스트
```bash
npm install
npm run dev
```
- 브라우저에서 `http://localhost:5173` 열기
- Mock user로 기본 기능 테스트 가능

### 2. Vercel 배포 후 테스트
1. **결제 테스트**:
   - Telegram에서 봇 열기
   - `/start` 입력
   - Mini App 열기
   - 사주 입력 → 결과 확인
   - 부적 생성 (100 Stars) 테스트
   - Premium Report (500 Stars) 테스트
   - Couple Compatibility (200 Stars) 테스트
   - Monthly Fortune (300 Stars) 테스트

2. **추천인 시스템 테스트**:
   - User A: `/start` → 초대 링크 복사
   - User B: 초대 링크로 가입 → 사주 완성
   - User A: 무료 부적 크레딧 확인

3. **결제 로깅 확인**:
   - Supabase `payments` 테이블에서 결제 기록 확인
   - `telegram_payment_charge_id`로 정산 확인 가능

### 3. 로그 확인
- **Vercel**: Dashboard → Functions → Logs
- **Supabase**: Logs → Edge Functions

---

## ⚠️ 주의사항

1. **환경 변수 보안**:
   - `TELEGRAM_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개하지 마세요
   - `.env.local`은 `.gitignore`에 포함되어 있어야 합니다

2. **결제 테스트**:
   - Telegram Stars는 실제 결제가 발생합니다
   - 테스트 시 소량으로 테스트하세요

3. **Webhook URL**:
   - Vercel 배포 후 URL이 변경되면 webhook을 다시 설정해야 합니다

---

## 🔧 문제 해결

### 결제가 작동하지 않을 때
1. `TELEGRAM_BOT_TOKEN` 확인
2. Webhook URL 확인: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
3. Vercel Functions 로그 확인

### 리포트/부적이 생성되지 않을 때
1. `OPENAI_API_KEY` 확인
2. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 확인
3. `saju_cache` 테이블에 사용자 데이터가 있는지 확인

### 추천인 시스템이 작동하지 않을 때
1. `referrals` 테이블 확인
2. `user_credits` 테이블 확인
3. Webhook에서 `/start ref_XXX` 파싱 확인
