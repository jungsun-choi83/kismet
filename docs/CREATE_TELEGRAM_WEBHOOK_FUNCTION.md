# 📝 Telegram Webhook Edge Function 생성 가이드

## 상황: Edge Functions 목록에 telegram-webhook이 없을 때

### 방법 1: Via Editor로 직접 만들기 (추천)

#### Step 1: 새 함수 생성
1. Edge Functions 페이지에서
2. **"Deploy a new function"** 버튼 클릭
3. 또는 **"Via Editor"** 섹션의 **"Open Editor"** 버튼 클릭

#### Step 2: 함수 이름 입력
1. 함수 이름 입력: `telegram-webhook`
2. **"Create function"** 클릭

#### Step 3: 코드 붙여넣기
1. Cursor에서 `supabase/functions/telegram-webhook/index.ts` 파일 열기
2. **전체 내용 복사** (Ctrl+A → Ctrl+C)
3. Supabase Editor의 빈 코드 영역에 **붙여넣기** (Ctrl+V)

#### Step 4: 저장 및 배포
1. **"Deploy"** 버튼 클릭
2. "Deployed successfully" 메시지 확인

---

### 방법 2: CLI로 배포하기 (고급)

터미널/명령 프롬프트에서:

```bash
# 1. Supabase CLI 설치 확인
supabase --version

# 2. Supabase 로그인
supabase login

# 3. 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# 4. 함수 배포
supabase functions deploy telegram-webhook
```

**주의:** CLI 방법은 Supabase CLI가 설치되어 있어야 합니다.

---

## 코드 확인

`supabase/functions/telegram-webhook/index.ts` 파일이 있는지 확인하세요.

**없다면:** 알려주시면 새로 만들어드리겠습니다!

---

## 배포 후 확인

1. Edge Functions 목록에 **"telegram-webhook"** 함수가 보이는지 확인
2. 함수를 클릭해서 코드가 제대로 들어갔는지 확인
3. **"Deploy"** 또는 **"Redeploy"** 버튼으로 배포 확인

---

## 다음 단계

함수가 생성되고 배포되면:
1. **환경 변수 설정** (Secrets)
2. **Webhook URL 설정** (Telegram BotFather)

문제가 있으면 알려주세요!
