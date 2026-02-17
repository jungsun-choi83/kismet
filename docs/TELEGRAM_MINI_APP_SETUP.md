# Telegram Mini App 설정 가이드

## 🔍 Mini App은 별도 명령어로 관리합니다

"Edit Bot" 화면에는 Mini App 설정이 없습니다. **별도 명령어**를 사용해야 합니다.

---

## 📋 방법 1: 기존 앱 확인 및 편집

### 1단계: 앱 목록 확인
BotFather에게 다음 명령어 입력:
```
/myapps
```

### 2단계: 앱이 있으면
- 앱 목록이 나오면 해당 앱 선택
- "Edit App" 또는 "Edit Web App URL" 옵션 선택
- URL을 `https://kismet-beta.vercel.app`로 설정

### 3단계: 앱이 없으면
- 다음 방법 2로 새로 만들기

---

## 📋 방법 2: 새 앱 만들기

### 1단계: 새 앱 생성
BotFather에게 다음 명령어 입력:
```
/newapp
```

### 2단계: 봇 선택
- `@kismet_saju_bot` 선택

### 3단계: 앱 정보 입력
BotFather가 순서대로 물어볼 것입니다:

1. **App Title**: `KISMET` (또는 원하는 이름)
2. **Short Name**: `kismet` (URL에 사용됨)
3. **Web App URL**: `https://kismet-beta.vercel.app`
   - ⚠️ `https://` 포함
   - 끝에 `/` 없이 입력
4. **Description**: `Discover your destiny through Four Pillars of Destiny` (선택사항)

---

## 📋 방법 3: 봇 메뉴 버튼 설정 (대안)

만약 위 방법이 안 되면, 봇 메뉴 버튼을 사용할 수 있습니다:

### 1단계: 메뉴 버튼 설정
BotFather에게:
```
/setmenubutton
```

### 2단계: 봇 선택
- `@kismet_saju_bot` 선택

### 3단계: 버튼 설정
- Button Text: `Open Kismet`
- URL: `https://kismet-beta.vercel.app`

---

## ✅ 확인 방법

1. Telegram에서 `@kismet_saju_bot` 봇 열기
2. 봇 채팅창 하단에 **"Open Kismet"** 버튼이 보이는지 확인
3. 버튼 클릭 → 미니앱이 열리는지 확인

---

## 🔧 문제 해결

### `/myapps`가 작동하지 않으면
- BotFather에게 직접 물어보기: `How do I set up a web app for my bot?`
- 또는 `/help` 명령어로 도움말 확인

### 앱이 이미 있는데 수정이 안 되면
- `/deleteapp`으로 삭제 후 `/newapp`으로 새로 만들기

---

## 📝 요약

1. BotFather에게 `/myapps` 입력 → 앱 확인
2. 앱이 있으면 → 편집
3. 앱이 없으면 → `/newapp`으로 새로 만들기
4. Web App URL: `https://kismet-beta.vercel.app`
5. 테스트
