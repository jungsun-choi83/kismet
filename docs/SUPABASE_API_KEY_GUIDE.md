# Supabase API 키 찾는 방법 (비전공자용)

## ⚠️ 중요: Organization Settings가 아닙니다!

API 키는 **프로젝트 내부의 Settings**에 있습니다.

---

## 📋 올바른 방법

### 1단계: 프로젝트 선택

1. 현재 화면에서 **"kismet"** 프로젝트 카드 클릭
   - (Status가 "ACTIVE"인 초록색 프로젝트)

### 2단계: 프로젝트 대시보드로 이동

- 프로젝트를 클릭하면 프로젝트 대시보드로 이동합니다
- 왼쪽 사이드바가 바뀝니다

### 3단계: 프로젝트 Settings 찾기

1. 왼쪽 사이드바 맨 아래를 보세요
2. **톱니바퀴 아이콘** (Settings) 클릭
   - ⚠️ 이건 **프로젝트 레벨의 Settings**입니다
   - Organization Settings가 아닙니다!

### 4단계: API 메뉴 클릭

1. Settings 페이지가 열리면
2. 왼쪽 메뉴에서 **"API"** 클릭
   - (Database, Auth, API, Storage 등이 보입니다)

### 5단계: API 키 확인

이제 다음이 보입니다:

**① Project URL**
- 이것이 `SUPABASE_URL`입니다
- 예: `https://waalgxnmyqhlwjgwfobf.supabase.co`

**② API Keys**
- **anon** key (공개 키)
- **service_role** key (비밀 키) ← 이것이 필요합니다!
- **Reveal** 버튼 클릭해서 키 보이게 하기

---

## 🔍 단계별 스크린샷 설명

### 현재 화면 (프로젝트 목록)
```
┌─────────────────────────────┐
│  Projects                   │
│                             │
│  [kismet] ← 이걸 클릭!      │
│  [everskin40]               │
└─────────────────────────────┘
```

### 프로젝트 클릭 후 (프로젝트 대시보드)
```
┌─────────────────────────────┐
│  kismet                     │
│                             │
│  왼쪽 사이드바:              │
│  - Table Editor             │
│  - SQL Editor               │
│  - ...                      │
│  - ⚙️ Settings ← 여기!      │
└─────────────────────────────┘
```

### Settings 클릭 후
```
┌─────────────────────────────┐
│  Settings                   │
│                             │
│  왼쪽 메뉴:                  │
│  - General                  │
│  - Database                 │
│  - API ← 여기 클릭!         │
│  - Auth                      │
└─────────────────────────────┘
```

### API 페이지
```
┌─────────────────────────────┐
│  API                        │
│                             │
│  Project URL:                │
│  https://xxx.supabase.co    │
│                             │
│  API Keys:                  │
│  anon: xxxxx                │
│  service_role: [Reveal]     │ ← 클릭!
└─────────────────────────────┘
```

---

## ✅ 요약

1. **"kismet" 프로젝트 클릭** (프로젝트 목록에서)
2. 왼쪽 사이드바 맨 아래 **Settings** 클릭 (프로젝트 레벨)
3. **API** 클릭
4. **Project URL**과 **service_role** 키 복사

---

## ⚠️ 혼동하기 쉬운 부분

- ❌ **Organization Settings**: 조직 전체 설정 (API 키 없음)
- ✅ **Project Settings**: 프로젝트별 설정 (API 키 있음)

프로젝트를 먼저 선택해야 합니다!
