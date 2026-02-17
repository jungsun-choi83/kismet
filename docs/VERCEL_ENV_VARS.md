# Vercel 환경 변수 설정 가이드

## 문제 해결: API Error 500 및 미니앱 URL 누락

### 현재 문제
- API 서버리스 함수에서 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 찾지 못함
- `MINI_APP_URL` 환경 변수가 없음

### 해결 방법: Vercel에 다음 환경 변수 추가

#### 1. Supabase 환경 변수 (서버리스 함수용)

**중요**: 프론트엔드는 `VITE_` 접두사를 사용하지만, 서버리스 함수는 **접두사 없이** 사용합니다.

1. **`SUPABASE_URL`** 추가:
   - 값: `VITE_SUPABASE_URL`과 동일한 값
   - 예: `https://xxxxx.supabase.co`

2. **`SUPABASE_SERVICE_ROLE_KEY`** 추가 (권장):
   - Supabase 대시보드 → Project Settings → API
   - "service_role" 키 복사 (⚠️ 비밀 키입니다!)
   - 또는 `SUPABASE_ANON_KEY` 사용 가능 (보안상 service_role 권장)

3. **`SUPABASE_ANON_KEY`** 추가 (선택사항):
   - 값: `VITE_SUPABASE_ANON_KEY`와 동일한 값
   - `SUPABASE_SERVICE_ROLE_KEY`가 있으면 선택사항

#### 2. 미니앱 URL 환경 변수

**`MINI_APP_URL`** 추가:
- 값: Vercel 배포 URL
- 예: `https://kismet-beta.vercel.app`
- 또는 실제 배포된 도메인 URL

### Vercel에 추가하는 방법

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. **Add Environment Variable** 클릭
4. 다음 변수들을 하나씩 추가:

```
변수 이름: SUPABASE_URL
값: https://xxxxx.supabase.co (VITE_SUPABASE_URL과 동일)

변수 이름: SUPABASE_SERVICE_ROLE_KEY
값: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Supabase에서 복사)

변수 이름: MINI_APP_URL
값: https://kismet-beta.vercel.app (또는 실제 배포 URL)
```

5. **Environment** 선택: **Production**, **Preview**, **Development** 모두 선택
6. **Save** 클릭
7. **Redeploy** (Deployments → 최신 배포 → ... → Redeploy)

### 확인 방법

환경 변수 추가 후:
1. Vercel에서 **Redeploy** 실행
2. 텔레그램에서 부적 생성 테스트
3. API Error 500이 해결되어야 함

### 참고

- `VITE_` 접두사는 프론트엔드(Vite)에서만 사용됩니다
- 서버리스 함수(`/api/*`)는 `process.env.VARIABLE_NAME` 형식을 사용합니다
- `SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회할 수 있으므로 비밀로 관리하세요
