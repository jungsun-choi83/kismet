# 긴급 수정 가이드

## 현재 문제
1. 무료 버튼이 여전히 나타남
2. 결제창이 나오지 않음
3. Edge Function 에러 발생

## 즉시 확인할 것

### 1. Vercel 배포 상태 확인
1. Vercel 대시보드 → 프로젝트
2. **Deployments** 탭
3. 최신 배포 상태 확인:
   - ✅ "Ready" (녹색) → 정상
   - ⏳ "Building" → 완료 대기
   - ❌ "Error" → 에러 확인 필요

### 2. 환경 변수 확인 (중요!)
**Vercel → Settings → Environment Variables:**

다음 변수들이 **모두** 있는지 확인:
- ✅ `VITE_SUPABASE_URL` (프론트엔드용)
- ✅ `VITE_SUPABASE_ANON_KEY` (프론트엔드용)
- ✅ `SUPABASE_URL` (서버용)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (서버용)
- ✅ `MINI_APP_URL`
- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `OPENAI_API_KEY`

**특히 `VITE_SUPABASE_URL`이 `placeholder`가 아닌 실제 Supabase URL인지 확인!**

### 3. 재배포 (캐시 없이)
1. **Caches** 섹션에서:
   - "Purge Data Cache" 클릭
2. **Deployments** 탭으로 이동
3. 최신 배포의 "..." → **"Redeploy"**
4. **"Use existing Build Cache" 체크 해제** (매우 중요!)
5. 재배포 시작
6. 완료될 때까지 대기 (3-5분)

### 4. 텔레그램 앱 완전 재시작
1. 텔레그램 앱 완전 종료
2. Windows 작업 관리자에서 프로세스 확인
3. 앱 재시작
4. 미니앱 다시 열기

## 확인 사항

재배포 후:
- [ ] 무료 버튼이 사라졌는지 확인
- [ ] "Get My Talisman" 버튼만 보이는지 확인
- [ ] 버튼 클릭 시 결제창이 열리는지 확인

## 여전히 문제가 있으면

**Vercel Functions 로그 확인:**
1. Vercel → Functions 탭
2. `/api/create-invoice` 클릭
3. **Logs** 탭에서 에러 확인
4. 에러 메시지를 알려주세요

## 핵심 포인트

**가장 중요한 것:**
1. ✅ `VITE_SUPABASE_URL` 환경 변수가 올바른지 확인
2. ✅ 재배포 시 **"Use existing Build Cache" 체크 해제**
3. ✅ 텔레그램 앱 완전 재시작
