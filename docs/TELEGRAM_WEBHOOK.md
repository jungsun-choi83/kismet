# 텔레그램 봇 웹훅 설정

`/start` 입력 시 환영 메시지와 웹앱 열기 버튼이 나오려면, **웹훅을 한 번만 등록**해야 합니다.

## 1. Vercel 환경 변수

- **Settings → Environment Variables**에 다음이 있는지 확인하세요.
  - `TELEGRAM_BOT_TOKEN`: 봇 토큰
  - `MINI_APP_URL`: 미니앱 주소 (예: `https://kismet-beta.vercel.app`)

## 2. 웹훅 등록 (한 번만)

배포된 주소가 `https://kismet-beta.vercel.app` 라면, 브라우저나 터미널에서 아래 주소를 **한 번** 열어주세요.

```
https://api.telegram.org/bot<여기에_봇_토큰_붙여넣기>/setWebhook?url=https://kismet-beta.vercel.app/api/telegram-webhook
```

예시 (토큰이 `123:ABC` 일 때):

```
https://api.telegram.org/bot123:ABC/setWebhook?url=https://kismet-beta.vercel.app/api/telegram-webhook
```

응답에 `"ok":true` 가 오면 성공입니다. 이후 봇에 `/start` 를 보내면 환영 메시지와 버튼이 나옵니다.
