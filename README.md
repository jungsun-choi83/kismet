# KISMET — Discover Your Destiny

A Telegram Mini App for Eastern Four Pillars of Destiny (Saju) analysis and AI-generated talisman images.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, i18next
- **Telegram:** @telegram-apps/sdk-react
- **Backend:** Supabase (Auth, DB, Edge Functions, Storage)
- **AI:** OpenAI GPT-4o-mini (readings), DALL-E 3 (talismans)
- **Payments:** Telegram Stars
- **Deploy:** Vercel

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_GEOAPIFY_KEY` — Geoapify API key (city autocomplete)
- `OPENAI_API_KEY` — OpenAI API key (for AI talisman generation via DALL-E 3)

### 3. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations: `supabase db push` (or run `supabase/migrations/001_initial_schema.sql` in SQL editor)
3. Create a storage bucket named `talismans` (public)
4. Deploy Edge Functions and set secrets:

```bash
supabase functions deploy calculate-saju
supabase functions deploy generate-talisman
supabase functions deploy daily-fortune
supabase functions deploy create-invoice
supabase functions deploy telegram-webhook

supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set BOT_TOKEN=...
supabase secrets set GEOAPIFY_KEY=...
supabase secrets set MINI_APP_URL=https://your-app.vercel.app
```

### 4. Telegram Bot (BotFather)

1. `/newbot` — Create bot
2. `/newapp` — Create Mini App, set URL to your Vercel URL
3. Set webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SUPABASE_EDGE_URL>/telegram-webhook`
4. `/setcommands` — Register: start, fortune, talisman

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy to Vercel

```bash
npm run build
```

Connect your repo to Vercel. Build command: `npm run build`, output: `dist`.

## Project structure

```
src/
  components/    # Reusable UI
  pages/         # Route screens
  store/         # Zustand
  lib/           # API, Supabase, Telegram
  hooks/         # useTelegramUser, useGeoapify
  i18n/          # en, ar, ko, ja, es
  types/         # TypeScript types
supabase/
  migrations/    # DB schema
  functions/     # Edge Functions
```
