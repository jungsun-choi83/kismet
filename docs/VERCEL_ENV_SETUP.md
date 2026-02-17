# Vercel 환경 변수 추가하기 (비전공자용 가이드)

## 📋 추가해야 할 3개 환경 변수

1. **MINI_APP_URL** - 앱 주소
2. **SUPABASE_URL** - Supabase 프로젝트 주소
3. **SUPABASE_SERVICE_ROLE_KEY** - Supabase 비밀 키

---

## 🚀 단계별 가이드

### 1단계: Vercel에 로그인

1. 브라우저에서 [vercel.com](https://vercel.com) 열기
2. 로그인 (GitHub 계정으로 로그인하면 됩니다)

---

### 2단계: 프로젝트 선택

1. Vercel 대시보드에서 **KISMET 프로젝트** 클릭
2. 상단 메뉴에서 **Settings** 클릭
3. 왼쪽 사이드바에서 **Environment Variables** 클릭

---

### 3단계: 환경 변수 추가하기

각각 하나씩 추가합니다:

#### ✅ 1번: MINI_APP_URL 추가

1. **Key** 입력란에: `MINI_APP_URL`
2. **Value** 입력란에: `https://your-app-name.vercel.app`
   - ⚠️ `your-app-name` 부분을 **실제 Vercel 배포 주소**로 바꾸세요!
   - 예: `https://kismet-beta.vercel.app`
   - (Vercel 대시보드에서 프로젝트를 열면 상단에 주소가 보입니다)
3. **Environment**는 모두 체크: Production, Preview, Development
4. **Add** 버튼 클릭

#### ✅ 2번: SUPABASE_URL 추가

1. **Key** 입력란에: `SUPABASE_URL`
2. **Value** 입력란에: Supabase에서 가져오기
   - Supabase.com 로그인
   - 프로젝트 선택
   - 왼쪽 사이드바 **Settings** → **API**
   - **Project URL** 복사 (예: `https://abcdefgh.supabase.co`)
   - 이 값을 붙여넣기
3. **Environment**는 모두 체크
4. **Add** 버튼 클릭

#### ✅ 3번: SUPABASE_SERVICE_ROLE_KEY 추가

1. **Key** 입력란에: `SUPABASE_SERVICE_ROLE_KEY`
2. **Value** 입력란에: Supabase에서 가져오기
   - 같은 Supabase 페이지 (Settings → API)
   - **service_role** 키 찾기 (⚠️ anon key가 아닙니다!)
   - **Reveal** 버튼 클릭해서 보이게 하기
   - 긴 키 값 복사 (예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - 이 값을 붙여넣기
3. **Environment**는 모두 체크
4. **Add** 버튼 클릭

---

### 4단계: 저장 확인

추가한 3개가 목록에 보이는지 확인:
- ✅ MINI_APP_URL
- ✅ SUPABASE_URL  
- ✅ SUPABASE_SERVICE_ROLE_KEY

---

### 5단계: 재배포 (중요!)

환경 변수를 추가한 후에는 **반드시 재배포**해야 합니다:

1. Vercel 대시보드에서 **Deployments** 탭 클릭
2. 가장 최근 배포 옆 **...** (점 3개) 클릭
3. **Redeploy** 클릭
4. "Use existing Build Cache" 체크 해제 (선택사항)
5. **Redeploy** 버튼 클릭

---

## 📸 스크린샷 가이드

### Vercel에서 환경 변수 추가하는 화면:

```
┌─────────────────────────────────────┐
│  Environment Variables              │
├─────────────────────────────────────┤
│  Key              Value             │
│  ─────────────────────────────────  │
│  TELEGRAM_BOT_TOKEN  [이미 있음]    │
│  OPENAI_API_KEY      [이미 있음]    │
│  MINI_APP_URL        [추가 필요]    │ ← 여기에 추가
│  SUPABASE_URL        [추가 필요]    │ ← 여기에 추가
│  SUPABASE_SERVICE... [추가 필요]    │ ← 여기에 추가
└─────────────────────────────────────┘
```

---

## ⚠️ 주의사항

1. **MINI_APP_URL**은 반드시 `https://`로 시작해야 합니다
2. **SUPABASE_SERVICE_ROLE_KEY**는 매우 긴 문자열입니다 (복사할 때 전체를 복사하세요)
3. 환경 변수 추가 후 **재배포**를 잊지 마세요!

---

## ✅ 완료 확인

재배포가 완료되면:
1. Telegram 봇에서 `/start` 입력
2. Mini App 열기
3. 사주 입력 → 결과 확인
4. 결제 기능 테스트

모두 작동하면 성공입니다! 🎉
