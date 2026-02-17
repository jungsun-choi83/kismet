# 배포 문제 해결 가이드

## 현재 문제
1. 무료 버튼이 여전히 나타남
2. API 500 에러 발생

## 해결 방법

### 1단계: Vercel 재배포 확인

1. **Vercel 대시보드** 열기
2. 프로젝트 선택
3. **Deployments** 탭 클릭
4. 최신 배포 확인:
   - 상태가 "Ready"인지 확인
   - "Building" 또는 "Error" 상태면 완료될 때까지 대기
5. **강제 재배포**:
   - 최신 배포의 "..." 메뉴 클릭
   - **"Redeploy"** 선택
   - 완료될 때까지 대기 (2-3분)

### 2단계: 환경 변수 확인

**Vercel → Settings → Environment Variables**에서 다음 변수들이 모두 있는지 확인:

✅ 필수 환경 변수:
- `SUPABASE_URL` (VITE_ 없이)
- `SUPABASE_SERVICE_ROLE_KEY` (service_role 키)
- `MINI_APP_URL` (배포 URL)
- `TELEGRAM_BOT_TOKEN`
- `OPENAI_API_KEY`
- `VITE_SUPABASE_URL` (프론트엔드용)
- `VITE_SUPABASE_ANON_KEY` (프론트엔드용)

### 3단계: 브라우저 캐시 지우기

**텔레그램 데스크톱 앱:**
1. 앱 완전 종료
2. 재시작
3. 미니앱 다시 열기

**또는 텔레그램 웹:**
1. 브라우저에서 `Ctrl + Shift + R` (강제 새로고침)
2. 또는 개발자 도구 열기 (F12)
3. Network 탭 → "Disable cache" 체크
4. 페이지 새로고침

### 4단계: API 500 에러 해결

**Vercel Functions 로그 확인:**
1. Vercel 대시보드 → 프로젝트
2. **Functions** 탭 클릭
3. `/api/create-invoice` 또는 `/api/generate-talisman` 클릭
4. **Logs** 탭에서 에러 메시지 확인

**가능한 원인:**
- `SUPABASE_URL` 또는 `SUPABASE_SERVICE_ROLE_KEY` 누락
- `TELEGRAM_BOT_TOKEN` 누락
- `OPENAI_API_KEY` 누락

### 5단계: 배포 후 확인

재배포 완료 후:
1. 텔레그램 앱 완전 종료 후 재시작
2. 미니앱 다시 열기
3. 부적 페이지로 이동
4. 확인 사항:
   - ✅ "Generate FREE Talisman" 버튼이 **없어야** 함
   - ✅ "Get My Talisman" 버튼만 보여야 함
   - ✅ 버튼 클릭 시 결제창이 열려야 함

## 빠른 체크리스트

- [ ] Vercel 재배포 완료
- [ ] 모든 환경 변수 설정 완료
- [ ] 텔레그램 앱 재시작
- [ ] 무료 버튼 사라짐 확인
- [ ] 결제창 정상 작동 확인

## 여전히 문제가 있으면

1. Vercel Functions 로그 확인
2. 브라우저 콘솔 에러 확인 (F12)
3. 환경 변수 값 재확인
4. Supabase 연결 상태 확인
