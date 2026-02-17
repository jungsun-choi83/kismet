# Supabase 프로젝트 만들기 (비전공자용 가이드)

## 🎯 목표
Supabase에 "kismet" 프로젝트를 새로 만들기

---

## 📋 단계별 가이드

### 1단계: 새 프로젝트 만들기

1. Supabase 대시보드에서 **"+ New project"** 버튼 클릭
   - (화면 오른쪽 위에 초록색 버튼)

### 2단계: 프로젝트 정보 입력

#### ① 프로젝트 이름
- **Name**: `kismet` 입력
- (또는 원하는 이름, 예: `kismet-saju`)

#### ② 데이터베이스 비밀번호 설정
- **Database Password**: 비밀번호 입력
- ⚠️ **중요**: 이 비밀번호는 나중에 필요할 수 있으니 **꼭 저장**하세요!
- (예: `MyPassword123!` 같은 강한 비밀번호)

#### ③ 지역 선택
- **Region**: `ap-northeast-2` (Seoul) 선택
- (한국에 가까워서 빠릅니다)

#### ④ 요금제 선택
- **Pricing Plan**: **FREE** 선택
- (무료 플랜으로 시작 가능)

### 3단계: 프로젝트 생성

1. **Create new project** 버튼 클릭
2. 1-2분 정도 기다리기 (프로젝트가 생성되는 중...)

---

## ✅ 프로젝트 생성 완료 후 해야 할 일

### 1. 프로젝트 열기
- 생성된 "kismet" 프로젝트 카드 클릭
- 프로젝트 대시보드로 이동

### 2. 데이터베이스 테이블 만들기

1. 왼쪽 사이드바에서 **SQL Editor** 클릭
2. **New query** 클릭
3. `docs/PAYMENTS_TABLE.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭 (또는 Ctrl+Enter)
6. "Success" 메시지 확인

### 3. API 키 확인하기 (Vercel에 추가할 값)

1. 왼쪽 사이드바에서 **Settings** 클릭
2. **API** 클릭
3. 다음 값들을 복사:
   - **Project URL**: `https://xxxxx.supabase.co` (이게 SUPABASE_URL)
   - **service_role** 키: **Reveal** 클릭해서 보이게 한 후 복사 (이게 SUPABASE_SERVICE_ROLE_KEY)

---

## 🔗 Vercel에 추가하기

위에서 복사한 값들을 Vercel 환경 변수에 추가:

1. **SUPABASE_URL** = Project URL
2. **SUPABASE_SERVICE_ROLE_KEY** = service_role 키

---

## ⚠️ 주의사항

- 프로젝트 생성에는 1-2분이 걸릴 수 있습니다
- Database Password는 잃어버리면 복구가 어렵습니다 (꼭 저장하세요)
- 무료 플랜으로도 충분히 사용 가능합니다

---

## 📸 참고

프로젝트가 생성되면:
- 프로젝트 목록에 "kismet" 프로젝트가 보입니다
- 프로젝트를 클릭하면 대시보드로 이동합니다
- 왼쪽 사이드바에서 SQL Editor, Settings 등에 접근할 수 있습니다
