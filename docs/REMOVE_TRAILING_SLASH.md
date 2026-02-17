# Web App URL 끝의 슬래시 제거

## ⚠️ 문제
BotFather의 Web App URL이 `https://kismet-beta.vercel.app/`로 설정되어 있음
- 끝에 `/` (슬래시)가 있음

## ✅ 해결 방법

### 1단계: Web App URL 수정
1. BotFather 화면에서 **"Edit Web App URL"** 버튼 클릭
2. URL 입력:
   ```
   https://kismet-beta.vercel.app
   ```
   - ⚠️ 끝의 `/` 제거
   - `https://kismet-beta.vercel.app/` ❌
   - `https://kismet-beta.vercel.app` ✅

### 2단계: 저장 및 테스트
1. URL 수정 후 저장
2. Telegram에서 `@kismet_saju_bot` 봇 열기
3. `/start` 입력
4. **"Open Kismet"** 버튼 클릭
5. 미니앱이 정상적으로 열리는지 확인

---

## 📝 요약
- 현재 URL: `https://kismet-beta.vercel.app/` (끝에 `/` 있음)
- 수정할 URL: `https://kismet-beta.vercel.app` (끝에 `/` 없음)

---

## 💡 참고
- URL 끝의 `/`는 때때로 리다이렉트 문제를 일으킬 수 있습니다
- Vercel에서는 끝에 `/` 없이도 정상 작동합니다
- Telegram Mini App에서는 끝에 `/` 없이 사용하는 것이 권장됩니다
