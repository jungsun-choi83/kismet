# 미니앱 URL 수정 가이드

## ⚠️ 문제
"Open Kismet" 버튼을 누르면 Vercel 배포 페이지로 가는 문제

---

## 🔧 해결 방법

### 1단계: 메인 도메인 확인

Vercel에서 보이는 도메인 중 **메인 도메인**을 사용하세요:
- **`kismet-beta.vercel.app`** ← 이걸 사용하세요 (가장 깔끔한 도메인)

다른 도메인들:
- `kismet-git-main-jungsun-chois-projects.vercel.app` (자동 생성된 도메인)
- `kismet-mkw27jeln-jungsun-chois-projects.vercel.app` (자동 생성된 도메인)

---

### 2단계: Telegram Bot Mini App URL 수정

1. Telegram에서 **@BotFather** 검색
2. 봇 선택
3. `/mybots` 입력
4. **"Kismet Destiny"** 봇 선택
5. **"Edit Bot"** 클릭
6. **"Edit Web App"** 또는 **"Edit Mini App"** 클릭
7. **Web App URL**을 다음으로 변경:
   ```
   https://kismet-beta.vercel.app
   ```
   - ⚠️ `https://` 포함해서 입력
   - 끝에 `/` 없이 입력

---

### 3단계: Vercel 환경 변수 확인

1. Vercel → Settings → Environment Variables
2. **MINI_APP_URL** 확인:
   - 값이 `https://kismet-beta.vercel.app`인지 확인
   - 다르면 수정

---

### 4단계: 재배포

1. Vercel → Deployments
2. 최근 배포 → **Redeploy**

---

## ✅ 확인 방법

1. Telegram에서 봇 열기
2. `/start` 입력
3. **"Open Kismet"** 버튼 클릭
4. **미니앱이 정상적으로 열리는지** 확인
   - Vercel 배포 페이지가 아닌 **실제 앱 화면**이 나와야 합니다
   - 사주 입력 화면이 보여야 합니다

---

## 📋 요약

1. **메인 도메인**: `kismet-beta.vercel.app` 사용
2. **BotFather에서 Mini App URL 수정**: `https://kismet-beta.vercel.app`
3. **Vercel MINI_APP_URL 확인**: `https://kismet-beta.vercel.app`
4. **재배포**
5. **테스트**

---

## ⚠️ 주의

- 여러 도메인이 보여도 **하나만 사용**하세요
- `kismet-beta.vercel.app`이 가장 깔끔하고 기억하기 쉽습니다
- 다른 도메인들은 Vercel이 자동으로 생성한 것이므로 무시해도 됩니다
