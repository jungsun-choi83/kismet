# Supabase Project URL 찾는 방법

## 🔍 Project URL은 General 설정에 있습니다

API Keys 페이지에는 Project URL이 표시되지 않습니다. **General 설정**에서 확인하세요.

---

## 📋 단계별 가이드

### 1단계: General 설정으로 이동

1. 현재 화면 왼쪽 사이드바를 보세요
2. **"PROJECT SETTINGS"** 섹션에서
3. **"General"** 클릭
   - (API Keys 위에 있습니다)

### 2단계: Project URL 확인

General 페이지에서 다음을 찾으세요:

**방법 1: Reference ID 확인**
- **Reference ID** 또는 **Project ID** 찾기
- 예: `waalgxnmyqhlwjgwfobf`
- Project URL = `https://waalgxnmyqhlwjgwfobf.supabase.co`

**방법 2: 직접 표시된 URL**
- **Project URL** 또는 **API URL** 필드가 있을 수 있습니다
- 예: `https://waalgxnmyqhlwjgwfobf.supabase.co`

---

## 🔧 Project URL 형식

Supabase Project URL은 항상 이 형식입니다:
```
https://{project-ref}.supabase.co
```

예시:
- `https://waalgxnmyqhlwjgwfobf.supabase.co`

---

## ✅ 확인 방법

1. **General** 설정으로 이동
2. **Reference ID** 또는 **Project ID** 찾기
3. `https://{찾은-ID}.supabase.co` 형식으로 URL 만들기

또는

1. **General** 설정에서 **Project URL** 필드 직접 확인

---

## 📝 Vercel에 추가할 값

1. **SUPABASE_URL** = `https://waalgxnmyqhlwjgwfobf.supabase.co` (General에서 확인)
2. **SUPABASE_SERVICE_ROLE_KEY** = service_role 키 (이미 복사함)

---

## 💡 팁

만약 General에서도 찾기 어렵다면:
- 브라우저 주소창을 보세요: `supabase.com/dashboard/project/waalgxnmyqhlwjgwfobf/...`
- `waalgxnmyqhlwjgwfobf` 부분이 Project ID입니다
- URL = `https://waalgxnmyqhlwjgwfobf.supabase.co`
