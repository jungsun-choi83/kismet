# 🔮 텔레그램 Stars 결제 플로우 가이드

## 결제 플로우 개요

```
유저가 버튼 클릭 
  ↓
우리 서버가 Telegram Bot API로 createInvoiceLink 생성 
  ↓
WebApp.openInvoice()로 텔레그램 네이티브 결제 팝업 띄움 
  ↓
유저가 Stars로 결제 
  ↓
텔레그램이 봇 webhook으로 pre_checkout_query 보냄 
  ↓
우리가 ok: true 응답 
  ↓
successful_payment 도착 
  ↓
DB에 기록 + fulfill-payment API 호출 + unlock
```

## 중요 사항

### 1. Currency는 반드시 "XTR"
- Telegram Stars의 공식 화폐 코드는 `"XTR"`입니다
- 다른 값 사용 시 결제가 실패합니다

### 2. provider_token은 반드시 빈 문자열 ""
- Telegram Stars는 외부 결제 프로바이더를 사용하지 않습니다
- `provider_token: ""`로 설정해야 합니다

### 3. openInvoice 콜백과 webhook 사이 시간차
- `openInvoice` 콜백이 `'paid'`를 반환해도 webhook이 즉시 도착하지 않을 수 있습니다
- 프론트엔드에서 DB 폴링 로직을 구현하여 결제 상태를 확인합니다
- 최대 10초간 1초 간격으로 폴링합니다

## 코드 구조

### 1. Invoice 생성 (`api/create-invoice/index.ts`)

```typescript
const apiRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: prod.title,
    description: prod.description,
    payload: JSON.stringify(payload), // 상품 정보 저장
    provider_token: '', // REQUIRED: 빈 문자열
    currency: 'XTR', // REQUIRED: Telegram Stars 화폐 코드
    prices: [{ label: prod.title, amount: prod.amount }],
  }),
})
```

### 2. Webhook 처리 (`supabase/functions/telegram-webhook/index.ts`)

#### pre_checkout_query 처리
```typescript
if (preCheckout) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      pre_checkout_query_id: preCheckout.id, 
      ok: true 
    }),
  })
}
```

#### successful_payment 처리
```typescript
if (successfulPayment) {
  // 1. DB에 결제 기록 저장
  await supabase.from('payments').insert({
    telegram_payment_charge_id: chargeId,
    telegram_user_id: telegramUserId,
    product,
    amount_stars: successfulPayment.total_amount,
    status: 'completed',
    payload: successfulPayment,
  })
  
  // 2. fulfill-payment API 호출 (콘텐츠 생성 + unlock)
  await fetch(fulfillUrl, {
    method: 'POST',
    body: JSON.stringify({
      telegram_user_id: telegramUserId,
      product,
      telegram_payment_charge_id: chargeId,
      payload: parsedPayload,
      chat_id: msg.chat?.id,
    }),
  })
}
```

### 3. 프론트엔드 폴링 (`src/pages/Result.tsx`)

```typescript
tg.openInvoice(data.invoiceLink, async (status) => {
  if (status === 'paid') {
    // DB 폴링 시작 (webhook 도착 대기)
    let attempts = 0
    const maxAttempts = 10
    
    const pollPayment = async (): Promise<boolean> => {
      const checkRes = await fetch('/api/check-payment', {
        method: 'POST',
        body: JSON.stringify({
          telegram_user_id: telegramUser.id,
          telegram_payment_charge_id: chargeId,
        }),
      })
      
      const checkData = await checkRes.json()
      
      if (checkData.paid) {
        onSuccess() // 결제 확인됨
        return true
      }
      
      if (attempts < maxAttempts) {
        attempts++
        await new Promise(resolve => setTimeout(resolve, 1000))
        return pollPayment()
      }
      
      // 최대 시도 횟수 도달 - 그래도 onSuccess 호출 (webhook이 나중에 처리)
      onSuccess()
      return false
    }
    
    await pollPayment()
  }
})
```

### 4. 결제 상태 확인 API (`api/check-payment/index.ts`)

```typescript
// DB에서 결제 상태 확인
const paymentRes = await fetch(
  `${SUPABASE_URL}/rest/v1/payments?telegram_payment_charge_id=eq.${chargeId}`,
  { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
)

const payments = await paymentRes.json()
const isPaid = payments[0]?.status === 'completed'

return { paid: isPaid, status: payments[0]?.status }
```

## 환경 변수 설정

### Supabase Edge Function
- `BOT_TOKEN`: Telegram Bot Token
- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key
- `FULFILL_PAYMENT_URL`: fulfill-payment API URL (예: `https://your-app.vercel.app/api/fulfill-payment`)

### Vercel Serverless Function
- `TELEGRAM_BOT_TOKEN`: Telegram Bot Token
- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key
- `MINI_APP_URL`: Mini App URL (예: `https://your-app.vercel.app`)

## 테스트 체크리스트

- [ ] `createInvoiceLink`에서 `currency: 'XTR'` 확인
- [ ] `createInvoiceLink`에서 `provider_token: ''` 확인
- [ ] `pre_checkout_query`에 `ok: true` 응답 확인
- [ ] `successful_payment` webhook에서 DB 저장 확인
- [ ] `successful_payment` webhook에서 `fulfill-payment` 호출 확인
- [ ] 프론트엔드 폴링 로직 작동 확인
- [ ] 결제 후 unlock 상태 업데이트 확인

## 트러블슈팅

### 문제: 결제는 되었는데 콘텐츠가 생성되지 않음
- **원인**: webhook이 도착하지 않았거나 `fulfill-payment` 호출 실패
- **해결**: DB에서 `payments` 테이블 확인 → 수동으로 `fulfill-payment` 호출

### 문제: openInvoice 콜백이 'paid'인데 DB에 기록이 없음
- **원인**: webhook 지연
- **해결**: 폴링 로직이 자동으로 처리 (최대 10초 대기)

### 문제: pre_checkout_query에 응답하지 않음
- **원인**: webhook URL 설정 오류 또는 타임아웃
- **해결**: Supabase Edge Function 로그 확인, webhook URL 재설정
