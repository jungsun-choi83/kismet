# 🚀 배포 가이드 (비전공자용)

## 2번: Supabase SQL 실행하기

### 단계 1: Supabase 대시보드 열기
1. 브라우저에서 https://supabase.com 접속
2. 로그인 (이미 로그인되어 있다면 스킵)
3. 프로젝트 목록에서 **"kismet"** 프로젝트 클릭

### 단계 2: SQL Editor 열기
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
   - 아이콘: 📝 또는 "SQL Editor" 텍스트
   - 없으면 "Database" → "SQL Editor" 경로로 찾기

### 단계 3: SQL 파일 내용 복사
1. Cursor에서 `docs/USER_LIMITS_TABLE.sql` 파일 열기
2. **전체 내용 선택** (Ctrl+A 또는 Cmd+A)
3. **복사** (Ctrl+C 또는 Cmd+C)

### 단계 4: SQL Editor에 붙여넣기
1. Supabase SQL Editor 화면에서
2. 왼쪽 상단에 **"New query"** 버튼이 있으면 클릭
3. 빈 텍스트 영역에 **붙여넣기** (Ctrl+V 또는 Cmd+V)

### 단계 5: SQL 실행
1. 오른쪽 하단 또는 상단에 **"Run"** 버튼 클릭
   - 또는 **Ctrl+Enter** (Windows) / **Cmd+Enter** (Mac) 키 누르기
2. 잠시 기다리면 아래에 결과가 표시됩니다
3. "Success. No rows returned" 또는 "Success" 메시지가 보이면 성공!

### 단계 6: PAYMENTS 테이블도 확인
1. 같은 SQL Editor에서
2. 아래 SQL을 복사해서 붙여넣고 실행:

```sql
-- payments 테이블에 status 컬럼이 있는지 확인하고 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'payments' AND column_name = 'status') THEN
    ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'completed';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
```

---

## 3번: Supabase Edge Function 배포하기

### 단계 1: Edge Functions 메뉴 찾기
1. Supabase 대시보드 왼쪽 메뉴에서
2. **"Edge Functions"** 클릭
   - 아이콘: ⚡ 또는 "Edge Functions" 텍스트
   - 없으면 "Functions" 메뉴 찾기

### 단계 2: telegram-webhook 함수 찾기
1. 함수 목록에서 **"telegram-webhook"** 찾기
2. 클릭해서 열기

### 단계 3: 배포하기
1. 함수 상세 페이지에서
2. 오른쪽 상단 또는 하단에 **"Deploy"** 버튼 클릭
3. 또는 **"Redeploy"** 버튼이 있으면 클릭
4. 잠시 기다리면 "Deployed successfully" 메시지가 표시됩니다

**만약 함수가 없다면:**
- Cursor에서 `supabase/functions/telegram-webhook/index.ts` 파일이 있는지 확인
- 없다면 Supabase CLI로 배포해야 할 수 있습니다 (이 경우 알려주세요)

---

## 4번: 환경 변수 설정하기

### 단계 1: Edge Functions Settings 열기
1. Supabase 대시보드에서
2. **"Edge Functions"** 메뉴 클릭
3. 오른쪽 상단 또는 설정 아이콘(⚙️) 클릭
4. **"Settings"** 또는 **"Secrets"** 메뉴 찾기

### 단계 2: FULFILL_PAYMENT_URL 추가
1. **"Add new secret"** 또는 **"New secret"** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: `FULFILL_PAYMENT_URL`
   - **Value**: `https://kismet-beta.vercel.app/api/fulfill-payment`
     - (만약 다른 Vercel URL을 사용한다면 그 URL로 변경)
3. **"Save"** 또는 **"Add"** 버튼 클릭

### 단계 3: 기존 환경 변수 확인
다음 변수들이 이미 있는지 확인:
- `BOT_TOKEN` 또는 `TELEGRAM_BOT_TOKEN` ✅
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `MINI_APP_URL` ✅

**없는 것이 있다면:**
- Vercel 환경 변수에서 복사해서 추가하세요

---

## 5번: 완료 확인

### 확인 사항:
- [ ] SQL 실행 완료 (Success 메시지 확인)
- [ ] Edge Function 배포 완료 (Deployed 메시지 확인)
- [ ] 환경 변수 추가 완료 (FULFILL_PAYMENT_URL 확인)

---

## 문제 해결

### Q: SQL Editor가 안 보여요
**A:** 왼쪽 메뉴를 스크롤해서 찾거나, 검색창에 "SQL" 입력

### Q: "permission denied" 에러가 나요
**A:** 
- Supabase 프로젝트의 Owner 권한이 있는지 확인
- 또는 프로젝트 관리자에게 권한 요청

### Q: Edge Function이 없어요
**A:** 
- Cursor에서 `supabase/functions/telegram-webhook/` 폴더 확인
- 없다면 새로 만들어야 할 수 있습니다 (이 경우 알려주세요)

### Q: 환경 변수 추가 버튼이 안 보여요
**A:**
- Edge Functions → Settings → Secrets 경로로 찾기
- 또는 "Environment Variables" 메뉴 찾기

---

## 다음 단계

모든 작업이 완료되면:
1. 텔레그램 봇에서 결제 테스트
2. 결제 후 DB에 기록되는지 확인
3. unlock 상태가 업데이트되는지 확인

문제가 있으면 알려주세요! 🚀
