# 최종 수정 가이드 - 무료 버튼 및 Edge Function 에러 해결

## 현재 문제
1. ✅ 코드 수정 완료 (무료 버튼 제거됨)
2. ❌ 배포 후에도 무료 버튼이 여전히 나타남
3. ❌ "Failed to send a request to the Edge Function" 에러 발생

## 해결 방법

### 1단계: Vercel 빌드 캐시 지우기

1. **Vercel 대시보드** → 프로젝트 선택
2. **Settings** → **General**
3. 스크롤 다운 → **"Clear Build Cache"** 버튼 클릭
4. 확인

### 2단계: 강제 재배포

1. **Deployments** 탭
2. 최신 배포의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. **"Use existing Build Cache"** 체크 해제 (중요!)
5. 재배포 시작
6. 완료될 때까지 대기 (3-5분)

### 3단계: Supabase Edge Function 확인

**Supabase 대시보드:**
1. **Edge Functions** 탭 클릭
2. 다음 함수들이 배포되어 있는지 확인:
   - `calculate-saju` ✅
   - `telegram-webhook` ✅
   - `generate-talisman` (선택사항 - 사용 안 함)
   - `create-invoice` (선택사항 - 사용 안 함)

**중요:** 현재 코드는 Vercel API (`/api/create-invoice`)를 사용하므로 Supabase Edge Function이 필요 없습니다.

### 4단계: 환경 변수 재확인

**Vercel → Settings → Environment Variables:**

필수 변수 확인:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `MINI_APP_URL`
- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `OPENAI_API_KEY`
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

### 5단계: 브라우저/앱 캐시 완전 삭제

**텔레그램 데스크톱 앱:**
1. 앱 완전 종료
2. Windows: 작업 관리자에서 프로세스 종료 확인
3. 앱 재시작
4. 미니앱 다시 열기

**또는 텔레그램 웹:**
1. 브라우저 개발자 도구 열기 (F12)
2. **Application** 탭 (Chrome) 또는 **Storage** 탭 (Firefox)
3. **Clear storage** 클릭
4. **Clear site data** 클릭
5. 페이지 새로고침 (Ctrl + Shift + R)

### 6단계: 배포 URL 확인

**Vercel 배포 URL이 올바른지 확인:**
1. Vercel → Deployments → 최신 배포 클릭
2. **"Visit"** 버튼으로 배포 URL 확인
3. 이 URL이 `MINI_APP_URL` 환경 변수와 일치하는지 확인

## 확인 체크리스트

재배포 후:
- [ ] 빌드 캐시 지움
- [ ] 재배포 완료 (캐시 없이)
- [ ] 텔레그램 앱 재시작
- [ ] 무료 버튼 사라짐 확인
- [ ] "Get My Talisman" 버튼만 보임
- [ ] 버튼 클릭 시 결제창 열림
- [ ] Edge Function 에러 없음

## 여전히 문제가 있으면

1. **Vercel Functions 로그 확인:**
   - Functions → `/api/create-invoice` → Logs
   - 에러 메시지 확인

2. **브라우저 콘솔 확인:**
   - F12 → Console 탭
   - 에러 메시지 확인

3. **네트워크 탭 확인:**
   - F12 → Network 탭
   - `/api/create-invoice` 요청 확인
   - 응답 상태 코드 확인

## 핵심 포인트

**가장 중요한 것:**
- ✅ **빌드 캐시를 지우고 재배포** (캐시 없이!)
- ✅ **텔레그램 앱 완전 재시작**
- ✅ **환경 변수 모두 확인**

이렇게 하면 문제가 해결될 것입니다!
