# 텔레그램 Stars 결제 점검 및 테스트

## 1. 지금 결제 버튼을 누르면 Stars 창이 뜨는지

### 동작 정리

| 상황 | 결제 버튼 문구 | 클릭 시 동작 |
|------|----------------|--------------|
| **데모 모드** (Supabase URL이 placeholder) | "Generate FREE Talisman" | 무료로 바로 부적 결과 페이지로 이동. **Stars 결제창은 안 뜸.** |
| **데모 모드** + 아래 "Stars 결제창 테스트" 버튼 | "⭐ Stars 결제창 테스트" | `/api/create-invoice` 호출 후 `openInvoice` → **Stars 결제창이 뜸** (Vercel에 `TELEGRAM_BOT_TOKEN` 필요). |
| **실제 서비스** (Supabase 연동) + 무료 체험 미사용 | "Generate FREE Talisman" | 무료로 결과 페이지로 이동. |
| **실제 서비스** + 무료 체험 이미 사용 | "Unlock Your Sacred Seal" | `callCreateInvoice`(Supabase) → 인보이스 링크 받음 → `openInvoice` → **Stars 결제창이 뜸.** |

즉, **실제로 Stars 결제창이 뜨는 경우**는 다음 두 가지뿐입니다.

1. **데모 모드**에서 **「⭐ Stars 결제창 테스트」** 버튼을 눌렀을 때  
   → Vercel(또는 로컬)의 `TELEGRAM_BOT_TOKEN` + `/api/create-invoice` 사용.
2. **실제 서비스**에서 **무료 체험을 이미 쓴 사용자**가 **「Unlock Your Sacred Seal」**을 눌렀을 때  
   → Supabase `create-invoice` 함수 + `openInvoice` 사용.

그래서 “결제 버튼”이라고 하면 **실제 유료 결제 버튼(Unlock Your Sacred Seal)**은 **실제 서비스 + 무료 체험 사용 후**에만 보이고, 그때 Stars 창이 뜨는지가 **실제 결제 흐름** 점검 포인트입니다.

---

## 2. Stars 결제창이 “실제로” 뜨는지 테스트하는 방법

### 방법 A: 데모 모드에서 「Stars 결제창 테스트」로 확인 (권장)

앱이 **데모 모드**여도, **텔레그램 미니앱**으로 열었을 때만 아래가 보입니다.

1. **소원·스타일** 선택 후  
   **「⭐ Stars 결제창 테스트」** 버튼이 보이면 클릭.
2. 다음이 되어 있으면:
   - **Vercel**: `TELEGRAM_BOT_TOKEN` 환경 변수 설정 후 재배포
   - **로컬**: `.env.local`에 `TELEGRAM_BOT_TOKEN` 설정 후 `npm run dev`
3. 버튼 클릭 시:
   - `/api/create-invoice`가 성공하면 → **Telegram Stars 결제창이 뜹니다.**
   - 실패하면 → 화면에 에러 메시지가 나옵니다 (토큰 미설정 등).

이걸로 “결제 버튼 누르면 Stars 창이 실제로 뜨는지”만 먼저 점검할 수 있습니다.

### 방법 B: 실제 서비스 모드로 결제 흐름 점검

1. **Supabase**  
   - 실제 프로젝트 URL/키 사용 (placeholder 아님).
2. **Supabase Edge Function**  
   - `create-invoice` 배포, 시크릿에 `BOT_TOKEN` (= `TELEGRAM_BOT_TOKEN`와 동일 값) 설정.
3. **DB**  
   - 테스트할 사용자(telegram_id)에 대해 `users.free_trial_used = true` 로 설정해 무료 체험 사용 처리.
4. 텔레그램에서 **미니앱** 열고, 부적 화면에서 **「Unlock Your Sacred Seal」** 클릭.  
   → 인보이스 링크 생성 후 **Stars 결제창**이 떠야 합니다.

---

## 3. 테스트 모드가 필요할 때 (Telegram 공식 테스트 환경)

Telegram은 **디지털 상품/Stars**용으로 별도 “테스트 봇/테스트 서버”를 두지 않고,  
**같은 Bot API**로 인보이스를 만들면 **실제 Stars 결제창**이 뜹니다.

- **테스트** 시에도 **동일한 createInvoiceLink + openInvoice** 흐름을 쓰면 됩니다.
- 소액(예: 50 Stars)으로 한 번 결제해 보면 “실제로 결제창이 뜨는지”까지 확인 가능합니다.
- 공식 문서: [Testing Your Bot](https://core.telegram.org/bots/features#testing-your-bot), [Payments (Stars)](https://core.telegram.org/bots/payments-stars)

즉, **“테스트 모드”를 따로 켜는 설정은 없고**,  
위 **방법 A(결제창 테스트 버튼)** 또는 **방법 B(실제 서비스 + free_trial_used)** 로  
**같은 Stars 결제창이 뜨는지** 보면 됩니다.

---

## 4. 단계별 설정 요약 (Stars 창이 뜨도록)

### 4-1. Vercel에서 「Stars 결제창 테스트」로 확인할 때

1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. **TELEGRAM_BOT_TOKEN** = (BotFather에서 발급한 봇 토큰) 추가 후 저장.
3. **Redeploy** 한 번 실행.
4. 텔레그램에서 **미니앱** 열고, 부적 화면에서 소원/스타일 선택 후 **「⭐ Stars 결제창 테스트」** 클릭.
5. **Stars 결제창이 뜨면** → 결제 버튼·인보이스 연동은 정상입니다.

### 4-2. 실제 유료 결제(Unlock Your Sacred Seal)까지 테스트할 때

1. Supabase에서 **create-invoice** 함수 배포, 시크릿에 **BOT_TOKEN** 설정.
2. `users` 테이블에서 테스트 유저의 **free_trial_used = true** 로 변경.
3. 앱에서 **실제 Supabase URL** 사용 (데모 모드 아님).
4. 미니앱에서 **「Unlock Your Sacred Seal」** 클릭 → Stars 결제창 확인.
5. (선택) **pre_checkout_query** 처리: 봇이 웹훅으로 `pre_checkout_query`를 받으면 `answerPreCheckoutQuery`로 승인해야 결제가 완료됩니다.  
   현재 `api/telegram-webhook`은 `/start`만 처리하므로, 결제 완료까지 테스트하려면 **pre_checkout_query**를 처리하는 백엔드(또는 Supabase 함수)를 추가해야 합니다.

---

## 5. 정리

- **“결제 버튼 누르면 Stars 결제창이 실제로 뜨는지”**  
  → **데모 모드**에서는 **「⭐ Stars 결제창 테스트」** 로 확인하고,  
  **실제 서비스**에서는 **Unlock Your Sacred Seal** + Supabase `create-invoice`로 확인하면 됩니다.
- **테스트 전용 모드**는 Telegram에서 별도로 두지 않으므로,  
  위 설정만 맞추면 **같은 Stars 결제창**으로 “테스트”와 “실제” 모두 점검할 수 있습니다.
