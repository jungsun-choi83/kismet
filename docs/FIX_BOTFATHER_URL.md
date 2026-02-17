# BotFather Web App URL 수정 가이드

## 🔍 문제
브라우저에서는 정상적으로 열리지만, Telegram Mini App에서는 Vercel 로그인 페이지가 나타남

## ⚠️ 원인
BotFather의 Web App URL이 잘못 설정되었을 가능성이 높습니다.

---

## ✅ 해결 방법

### 1단계: BotFather에서 앱 URL 확인

1. Telegram에서 **@BotFather** 열기
2. `/myapps` 입력
3. `kismet` 앱 선택
4. **Web App URL** 확인:
   - 현재 설정된 URL이 무엇인지 확인
   - `http://localhost:3000` 같은 로컬 주소가 아닌지 확인

---

### 2단계: Web App URL 수정

#### 방법 1: `/editapp` 명령어 사용
1. BotFather에게 `/editapp` 입력
2. `kismet` 앱 선택
3. **"Edit Web App URL"** 또는 **"Edit URL"** 선택
4. 다음 URL 입력:
   ```
   https://kismet-beta.vercel.app
   ```
   - ⚠️ `https://` 포함
   - 끝에 `/` 없이 입력
   - `localhost`가 아닌 Vercel 배포 URL 사용

#### 방법 2: 앱 삭제 후 재생성
만약 수정이 안 되면:
1. `/deleteapp` 입력
2. `kismet` 앱 삭제 확인
3. `/newapp` 입력
4. 다시 만들기:
   - Title: `KISMET`
   - Short Name: `kismet`
   - Web App URL: `https://kismet-beta.vercel.app`
   - 사진/GIF는 `/empty`로 건너뛰기

---

### 3단계: Vercel 배포 URL 확인

1. [vercel.com](https://vercel.com) 로그인
2. KISMET 프로젝트 선택
3. **Deployments** 탭 확인
4. 가장 최근 배포의 **Domains** 확인:
   - `kismet-beta.vercel.app`이 있는지 확인
   - 다른 도메인이면 그것을 사용

---

### 4단계: 테스트

1. Telegram에서 `@kismet_saju_bot` 봇 열기
2. `/start` 입력
3. **"Open Kismet"** 버튼 클릭
4. 미니앱이 정상적으로 열리는지 확인
   - Vercel 로그인 페이지가 아닌 **실제 앱 화면**이 나와야 합니다

---

## ⚠️ 주의사항

- **로컬호스트 (`localhost:3000`)는 사용하지 마세요**
- **Vercel 배포 URL만 사용하세요**: `https://kismet-beta.vercel.app`
- URL 끝에 `/` 없이 입력하세요

---

## ✅ 확인 체크리스트

- [ ] BotFather Web App URL이 `https://kismet-beta.vercel.app`인가?
- [ ] `localhost`나 로컬 주소가 아닌가?
- [ ] Vercel 배포가 "Ready" 상태인가?
- [ ] 브라우저에서 직접 URL이 정상 작동하는가?

---

## 📝 요약

1. **BotFather에게 `/myapps` 입력** → 앱 선택
2. **Web App URL 확인** → `localhost`가 아닌지 확인
3. **URL 수정** → `https://kismet-beta.vercel.app`로 설정
4. **테스트** → Telegram에서 "Open Kismet" 버튼 클릭

---

## 💡 팁

- 브라우저에서 정상 작동한다면 Vercel 배포는 문제없습니다
- 문제는 BotFather의 URL 설정입니다
- `localhost`는 로컬 개발용이므로 Telegram에서는 작동하지 않습니다
