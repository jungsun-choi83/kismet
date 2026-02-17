# OpenAI Usage Limits & Budget Management

## Overview

This app implements two types of usage limits:

1. **Daily Free User Limit**: Free users can make up to 3 AI calls per day
2. **Monthly Budget Cap**: Total OpenAI API costs are capped at $50/month

## Setup

### 1. Database Tables

Run the SQL in `docs/USAGE_LIMITS_TABLE.sql` in your Supabase SQL Editor:

```sql
-- Creates:
-- - daily_ai_usage (tracks daily usage per user)
-- - monthly_budget (tracks monthly costs)
-- - api_usage_log (logs all API calls)
```

### 2. Environment Variables

Add to Vercel (Settings → Environment Variables):

- `ADMIN_CHAT_ID` (optional): Your Telegram chat ID for budget cap alerts
  - To get your chat ID: Start a chat with `@userinfobot` on Telegram
  - Or use your bot's chat ID from BotFather

### 3. OpenAI Usage Limits (Recommended)

While the app enforces a $50/month cap in code, you should also set limits in OpenAI Dashboard:

1. Go to https://platform.openai.com/settings/organization/billing/limits
2. Set **Hard limit** to $50 (or your preferred amount)
3. Set **Soft limit** to $45 (to get a warning before hitting hard limit)
4. Enable email notifications

**Note**: OpenAI's hard limit will stop all API calls immediately when reached, which is a safety net beyond our app-level cap.

## How It Works

### Daily Free User Limit

- **Applies to**: Free users only (users who haven't paid)
- **Limit**: 3 AI calls per day (resets at midnight UTC)
- **Tracked in**: `daily_ai_usage` table
- **Functions affected**:
  - `calculate-saju` (Supabase Edge Function)
  - `daily-fortune` (Supabase Edge Function)

**When limit is reached**:
- User sees: "You've reached your daily free limit. Come back tomorrow or unlock premium!"
- AI generation is skipped, default/fallback content is shown

### Monthly Budget Cap

- **Applies to**: All AI calls (free and paid)
- **Limit**: $50/month (configurable in `api/lib/budgetCap.ts`)
- **Tracked in**: `monthly_budget` table
- **Functions affected**: All AI generation functions

**Cost calculation**:
- `gpt-4o`: $0.0025 per 1K input tokens, $0.01 per 1K output tokens
- `gpt-4o-mini`: $0.00015 per 1K input tokens, $0.0006 per 1K output tokens
- `dall-e-3`: $0.04 per image

**When cap is reached**:
- All AI calls are blocked
- Admin receives Telegram notification (if `ADMIN_CHAT_ID` is set)
- Users see: "Monthly budget limit reached. Please try again later."

## Monitoring

### Check Current Usage

Query Supabase:

```sql
-- Daily usage for a user
SELECT * FROM daily_ai_usage 
WHERE telegram_user_id = YOUR_USER_ID 
AND usage_date = CURRENT_DATE;

-- Monthly budget status
SELECT * FROM monthly_budget 
WHERE month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- API usage log (last 24 hours)
SELECT * FROM api_usage_log 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Reset Monthly Budget (if needed)

```sql
UPDATE monthly_budget 
SET total_cost_usd = 0, 
    usage_count = 0, 
    is_capped = false, 
    capped_at = NULL
WHERE month_year = '2026-02';
```

## Troubleshooting

### Budget cap reached but shouldn't be

1. Check `monthly_budget` table for current month
2. Verify cost calculations in `api/lib/budgetCap.ts` match OpenAI pricing
3. Check `api_usage_log` for unexpected high-cost calls

### Daily limit not resetting

- Daily limits reset at midnight UTC
- Check `usage_date` column matches current date (UTC)

### Admin notifications not working

- Verify `ADMIN_CHAT_ID` is set in Vercel environment variables
- Verify `TELEGRAM_BOT_TOKEN` is set
- Test by manually triggering a budget cap (temporarily lower `MONTHLY_BUDGET_CAP`)
