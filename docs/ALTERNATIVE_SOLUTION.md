# 배포 문제 해결 - 대안 방법

## 현재 상황
- 코드는 수정되었지만 배포가 안 됨
- 무료 버튼이 여전히 나타남
- Edge Function 에러 발생

## 대안 방법

### 방법 1: Git 강제 푸시 (가장 확실함)

**터미널에서 실행:**

```bash
# 프로젝트 폴더로 이동
cd "c:\Users\choi jungsun\Desktop\kismet"

# 변경사항 확인
git status

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "Remove free talisman button - always paid only"

# 강제 푸시 (주의: 이건 강제 푸시입니다)
git push --force

# 또는 일반 푸시
git push
```

Vercel이 Git과 연결되어 있다면 자동으로 재배포됩니다.

### 방법 2: Vercel CLI로 직접 배포

**터미널에서 실행:**

```bash
# Vercel CLI 설치 (처음 한 번만)
npm i -g vercel

# 프로젝트 폴더로 이동
cd "c:\Users\choi jungsun\Desktop\kismet"

# Vercel 로그인
vercel login

# 배포 (프로덕션)
vercel --prod

# 또는 개발 환경
vercel
```

### 방법 3: 브라우저 캐시 완전 삭제

**텔레그램 웹에서:**
1. 브라우저 개발자 도구 열기 (F12)
2. **Application** 탭 (Chrome) 또는 **Storage** 탭 (Firefox)
3. 왼쪽에서 **"Clear storage"** 클릭
4. 모든 항목 체크
5. **"Clear site data"** 클릭
6. 페이지 새로고침 (Ctrl + Shift + R)

**텔레그램 데스크톱 앱:**
1. 앱 완전 종료
2. Windows 작업 관리자에서 프로세스 확인
3. 앱 데이터 폴더 삭제 (선택사항):
   - `%APPDATA%\Telegram Desktop\tdata`
   - 또는 `%LOCALAPPDATA%\Telegram Desktop`
4. 앱 재시작

### 방법 4: Vercel에서 수동 배포

1. **Vercel 대시보드** → 프로젝트
2. **Settings** → **Git**
3. Git 저장소 연결 확인
4. **Deployments** 탭
5. **"Redeploy"** 버튼 클릭
6. **"Use existing Build Cache"** 체크 해제
7. 재배포

### 방법 5: 코드에 버전 추가 (캐시 우회)

`index.html`에 버전 파라미터 추가:

```html
<script type="module" src="/src/main.tsx?v=2"></script>
```

또는 `vite.config.ts`에 빌드 버전 추가

## 가장 확실한 방법

**Git 강제 푸시 + Vercel 재배포:**

1. Git에 푸시
2. Vercel에서 자동 배포 확인
3. 배포 완료 후 텔레그램 앱 재시작

## 확인 사항

배포 후:
- [ ] 무료 버튼 사라짐
- [ ] "Get My Talisman" 버튼만 보임
- [ ] 결제창 정상 작동

## 여전히 문제가 있으면

**Vercel Functions 로그 확인:**
- Functions → `/api/create-invoice` → Logs
- 에러 메시지 확인

**또는:**
- Vercel 대시보드 → Deployments → 최신 배포 → "View Function Logs"
- 에러 메시지 확인
