# 다음 단계 가이드 (Supabase SQL 완료 후)

## ✅ 완료된 것
- Supabase "kismet" 프로젝트 생성 완료
- 데이터베이스 테이블 생성 완료 (payments, saju_cache, referrals, user_credits)

---

## 📋 다음에 해야 할 일

### 1단계: Supabase에서 API 키 확인하기

#### ① Settings 열기
1. Supabase 대시보드 왼쪽 사이드바에서 **Settings** 클릭 (톱니바퀴 아이콘)
2. **API** 클릭

#### ② 두 가지 값 복사하기

**첫 번째: SUPABASE_URL**
- **Project URL** 찾기 (예: `https://waalgxnmyqhlwjgwfobf.supabase.co`)
- 이 값을 복사하세요
- 이것이 Vercel에 추가할 `SUPABASE_URL`입니다

**두 번째: SUPABASE_SERVICE_ROLE_KEY**
- 아래로 스크롤해서 **service_role** 키 찾기
- ⚠️ **anon key가 아닙니다!** service_role을 찾으세요
- **Reveal** 버튼 클릭해서 키 보이게 하기
- 긴 키 값 전체를 복사하세요 (예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- 이것이 Vercel에 추가할 `SUPABASE_SERVICE_ROLE_KEY`입니다

---

### 2단계: Vercel에 환경 변수 추가하기

1. [vercel.com](https://vercel.com) 로그인
2. KISMET 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭

#### 추가할 3개:

**① MINI_APP_URL**
- Key: `MINI_APP_URL`
- Value: Vercel 배포 주소 (예: `https://kismet-beta.vercel.app`)
- Environment: 모두 체크

**② SUPABASE_URL**
- Key: `SUPABASE_URL`
- Value: 위에서 복사한 Project URL
- Environment: 모두 체크

**③ SUPABASE_SERVICE_ROLE_KEY**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: 위에서 복사한 service_role 키
- Environment: 모두 체크

---

### 3단계: Vercel 재배포

1. Vercel 대시보드에서 **Deployments** 탭 클릭
2. 최근 배포 옆 **...** (점 3개) 클릭
3. **Redeploy** 클릭
4. 완료될 때까지 대기 (1-2분)

---

### 4단계: Telegram Webhook 설정

1. 브라우저에서 아래 주소 열기 (봇 토큰 넣기):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram-webhook
```

예시:
```
https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/setWebhook?url=https://kismet-beta.vercel.app/api/telegram-webhook
```

2. "ok": true 메시지가 나오면 성공!

---

### 5단계: 테스트하기

1. Telegram에서 봇 열기
2. `/start` 입력
3. Mini App 열기
4. 사주 입력 → 결과 확인
5. 부적 생성 테스트

---

## ✅ 체크리스트

- [ ] Supabase에서 SUPABASE_URL 복사
- [ ] Supabase에서 SUPABASE_SERVICE_ROLE_KEY 복사
- [ ] Vercel에 MINI_APP_URL 추가
- [ ] Vercel에 SUPABASE_URL 추가
- [ ] Vercel에 SUPABASE_SERVICE_ROLE_KEY 추가
- [ ] Vercel 재배포 완료
- [ ] Telegram Webhook 설정 완료
- [ ] 테스트 완료

---

## 🎉 완료!

모든 설정이 끝나면 앱이 정상 작동합니다!
