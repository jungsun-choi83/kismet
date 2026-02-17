# 마케팅 전 체크리스트

## ✅ 완료된 것
- ✅ Supabase 프로젝트 생성 및 테이블 설정 완료
- ✅ Vercel 배포 완료
- ✅ Telegram Mini App 설정 완료
- ✅ 미니앱 정상 작동 확인

---

## 🔍 마케팅 전 확인사항

### 1. OpenAI API 키 및 결제 설정

#### OpenAI 계정 설정:
1. [platform.openai.com](https://platform.openai.com) 로그인
2. **Settings** → **Billing** 클릭
3. **Payment methods** 확인:
   - 신용카드 등록 필요
   - 결제 한도 설정 (예: $100/월)
4. **API keys** 확인:
   - API 키가 생성되어 있는지 확인
   - 없으면 **"Create new secret key"** 클릭

#### Vercel 환경 변수 확인:
1. Vercel → Settings → Environment Variables
2. **OPENAI_API_KEY** 확인:
   - 값이 설정되어 있는지 확인
   - OpenAI에서 생성한 API 키와 일치하는지 확인

---

### 2. 기능 테스트

#### 기본 기능:
- [ ] 사주 입력 → 결과 확인
- [ ] 부적 생성 (100 Stars) 테스트
- [ ] Premium Report (500 Stars) 테스트
- [ ] Couple Compatibility (200 Stars) 테스트
- [ ] Monthly Fortune (300 Stars) 테스트

#### 결제 기능:
- [ ] Stars 결제창이 정상적으로 열리는지
- [ ] 결제 후 부적/리포트가 생성되는지
- [ ] Supabase `payments` 테이블에 기록되는지

#### 추천인 시스템:
- [ ] 초대 링크 생성 확인
- [ ] 친구가 링크로 가입 → 사주 완성
- [ ] 추천인에게 무료 부적 크레딧 지급 확인

---

### 3. 에러 처리 확인

#### 테스트 시나리오:
- [ ] 잘못된 생년월일 입력 → 에러 메시지 확인
- [ ] 네트워크 오류 시 → 재시도 기능 확인
- [ ] OpenAI API 오류 시 → 사용자에게 알림 확인

---

### 4. 로그 모니터링 설정

#### Vercel 로그 확인:
1. Vercel → **Logs** 탭
2. 실시간 로그 확인 가능
3. 에러 발생 시 알림 설정 (선택사항)

#### Supabase 로그 확인:
1. Supabase → **Logs** → **Edge Functions**
2. API 호출 로그 확인

---

## 💰 OpenAI 결제 등록 방법

### 1단계: OpenAI 계정 생성/로그인
1. [platform.openai.com](https://platform.openai.com) 접속
2. 계정 생성 또는 로그인

### 2단계: 결제 방법 추가
1. **Settings** → **Billing** 클릭
2. **Payment methods** → **Add payment method**
3. 신용카드 정보 입력
4. 저장

### 3단계: 사용 한도 설정 (선택사항)
1. **Usage limits** 설정
2. 월별 예산 설정 (예: $100/월)
3. 한도 초과 시 알림 설정

### 4단계: API 키 생성
1. **API keys** 탭 클릭
2. **"Create new secret key"** 클릭
3. 키 이름 입력 (예: "KISMET Production")
4. 키 복사 (⚠️ 한 번만 보여줌!)

### 5단계: Vercel에 API 키 추가
1. Vercel → Settings → Environment Variables
2. **OPENAI_API_KEY** 확인:
   - 이미 있으면 → 값이 올바른지 확인
   - 없으면 → 추가 (위에서 복사한 키)

---

## ⚠️ 중요 사항

### OpenAI 비용 관리:
- **DALL-E 3**: 이미지당 약 $0.04
- **GPT-4o**: 토큰당 비용 (요청 크기에 따라 다름)
- **월별 예산 설정 권장**: 예상치 못한 비용 방지

### 테스트 비용 절감:
- 로컬 개발 시 무료 체험 사용
- 프로덕션에서는 실제 사용량 모니터링

---

## 📋 마케팅 전 최종 체크리스트

### 필수:
- [ ] OpenAI 결제 등록 완료
- [ ] OpenAI API 키가 Vercel 환경 변수에 설정됨
- [ ] 모든 상품 결제 테스트 완료 (100/200/300/500 Stars)
- [ ] 결제 로깅이 Supabase에 정상 기록됨
- [ ] 추천인 시스템 테스트 완료

### 권장:
- [ ] 에러 처리 확인
- [ ] 로그 모니터링 설정
- [ ] 사용량 모니터링 설정
- [ ] OpenAI 사용 한도 설정

---

## 🎯 마케팅 시작 전 확인

모든 기능이 정상 작동하는지 최종 테스트:

1. **사주 입력** → 결과 확인
2. **부적 생성** (100 Stars) → 결제 → 생성 확인
3. **Premium Report** (500 Stars) → 결제 → 리포트 확인
4. **Couple Compatibility** (200 Stars) → 결제 → 리포트 확인
5. **Monthly Fortune** (300 Stars) → 결제 → 구독 확인
6. **추천인 링크** → 친구 가입 → 크레딧 지급 확인

---

## 📝 요약

1. **OpenAI 결제 등록** → 신용카드 추가
2. **API 키 생성** → Vercel 환경 변수에 추가
3. **모든 기능 테스트** → 결제 포함
4. **로그 모니터링 설정**
5. **마케팅 시작!**

---

## 💡 팁

- OpenAI는 사용한 만큼만 과금됩니다
- 무료 크레딧이 있을 수 있으니 확인해보세요
- 월별 예산을 설정하면 예상치 못한 비용을 방지할 수 있습니다

---

## 🎉 준비 완료!

모든 설정이 완료되면 마케팅을 시작할 수 있습니다!
