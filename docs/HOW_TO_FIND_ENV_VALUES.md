# 환경 변수 값 찾는 방법

## 2번: SUPABASE_URL 값 찾기

### 방법 1: Vercel에서 확인 (가장 쉬움)
1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. `VITE_SUPABASE_URL` 찾기
4. 그 값이 `SUPABASE_URL`의 값입니다
   - 예: `https://abcdefghijklmnop.supabase.co`

### 방법 2: Supabase에서 확인
1. Supabase 대시보드 열기: https://supabase.com
2. 프로젝트 선택 (kismet)
3. 왼쪽 메뉴에서 **Settings** (톱니바퀴 아이콘) 클릭
4. **API** 클릭
5. **Project URL** 섹션에서 URL 복사
   - 예: `https://abcdefghijklmnop.supabase.co`

---

## 3번: SUPABASE_SERVICE_ROLE_KEY 값 찾기

### Supabase에서 찾기 (필수)
1. Supabase 대시보드 열기: https://supabase.com
2. 프로젝트 선택 (kismet)
3. 왼쪽 메뉴에서 **Settings** (톱니바퀴 아이콘) 클릭
4. **API** 클릭
5. **Project API keys** 섹션 찾기
6. **service_role** 키 찾기
   - "anon" 키가 아니라 **"service_role"** 키입니다
7. **"Reveal"** 버튼 또는 눈 아이콘 클릭
8. 키 값 복사
   - 예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **주의**: service_role 키는 매우 강력한 권한을 가지고 있습니다. 절대 공개하거나 GitHub에 올리지 마세요!

---

## 요약

| 환경 변수 | 값 위치 | 예시 |
|---------|--------|------|
| `SUPABASE_URL` | Vercel의 `VITE_SUPABASE_URL` 또는 Supabase Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API → Project API keys → service_role → Reveal | `eyJhbGciOiJIUzI1NiIs...` (긴 문자열) |

---

## Supabase Settings → API 화면에서 보이는 것

```
Project URL
https://xxxxx.supabase.co

Project API keys
┌─────────────────────────────────────────┐
│ anon public                              │
│ eyJhbGciOiJIUzI1NiIs... (짧은 키)      │
│ [복사]                                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ service_role secret                      │
│ eyJhbGciOiJIUzI1NiIs... (긴 키)        │
│ [Reveal] [복사]                         │
└─────────────────────────────────────────┘
```

**service_role** 키를 사용하세요!
