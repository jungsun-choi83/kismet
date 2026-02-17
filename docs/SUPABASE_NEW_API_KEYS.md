# Supabase 새로운 API 키 시스템 가이드

## 🔍 현재 상황

Supabase가 새로운 API 키 시스템으로 업데이트되었습니다. 하지만 우리 코드에서는 **Legacy 키**가 필요합니다.

---

## ✅ 해결 방법

### 방법 1: Legacy 키 탭 확인 (권장)

1. 현재 화면에서 **"Legacy anon, service_role API keys"** 탭 클릭
   - (화면 상단에 탭이 있습니다)

2. Legacy 탭에서 다음을 확인:
   - **Project URL** → 이것이 `SUPABASE_URL`
   - **service_role** 키 → 이것이 `SUPABASE_SERVICE_ROLE_KEY`
   - **Reveal** 버튼 클릭해서 키 보이게 하기

---

### 방법 2: 새로운 키 사용 (코드 수정 필요)

만약 Legacy 탭이 없다면, 새로운 키 시스템을 사용할 수 있습니다:

- **Publishable key** = anon key와 유사 (프론트엔드용)
- **Secret key** = service_role key와 유사 (백엔드용)

하지만 코드 수정이 필요하므로, **방법 1 (Legacy 탭)을 먼저 시도**하세요.

---

## 📋 Vercel에 추가할 값

### Legacy 탭에서:
1. **Project URL** 복사 → `SUPABASE_URL`
2. **service_role** 키 복사 → `SUPABASE_SERVICE_ROLE_KEY`

### 또는 새로운 키 시스템에서:
1. **Project URL** (화면 상단 또는 General 설정에서)
2. **Secret key** (눈 아이콘 클릭해서 보이게 한 후 복사) → `SUPABASE_SERVICE_ROLE_KEY`

---

## ⚠️ 중요

- **Secret key**는 절대 공개하지 마세요!
- Vercel 환경 변수에만 추가하세요
- `.env` 파일에도 추가하지 마세요 (GitHub에 올라가면 안 됩니다)

---

## 🔍 Project URL 찾기

만약 Project URL이 보이지 않으면:
1. 왼쪽 사이드바에서 **"General"** 클릭
2. **Reference ID** 또는 **Project URL** 확인
3. 또는 Legacy 탭에서 확인
