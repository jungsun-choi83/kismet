-- Daily AI usage limits for free users (3 per day per user)
CREATE TABLE IF NOT EXISTS daily_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_ai_usage_telegram_date ON daily_ai_usage(telegram_user_id, usage_date);

-- Monthly OpenAI API budget tracking
CREATE TABLE IF NOT EXISTS monthly_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL UNIQUE, -- Format: 'YYYY-MM' (e.g., '2026-02')
  total_cost_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  budget_cap_usd NUMERIC(10, 4) NOT NULL DEFAULT 50.00,
  is_capped BOOLEAN NOT NULL DEFAULT false,
  capped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_budget_month_year ON monthly_budget(month_year);

-- API usage log for tracking individual calls
CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT,
  model TEXT NOT NULL, -- 'gpt-4o', 'gpt-4o-mini', 'dall-e-3'
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  tokens_input INTEGER,
  tokens_output INTEGER,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  is_free_user BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_log_month_year ON api_usage_log(month_year);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_telegram_user ON api_usage_log(telegram_user_id);

ALTER TABLE daily_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
