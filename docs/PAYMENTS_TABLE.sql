-- Run in Supabase SQL Editor: payment logging, report/couple delivery, referrals, subscriptions.

-- Payments: who, when, how many Stars (reconciliation); product = talisman | couple | monthly_fortune | report
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  product TEXT NOT NULL,
  amount_stars INTEGER NOT NULL,
  telegram_payment_charge_id TEXT NOT NULL UNIQUE,
  payload JSONB,
  result_url TEXT,
  report_text TEXT,
  couple_report_text TEXT,
  subscription_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_telegram_user ON payments(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_product ON payments(product);

-- Add columns if table already existed (run once)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'couple_report_text') THEN
    ALTER TABLE payments ADD COLUMN couple_report_text TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'subscription_expires_at') THEN
    ALTER TABLE payments ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'status') THEN
    ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'completed';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Saju cache for server-side generation after payment
CREATE TABLE IF NOT EXISTS saju_cache (
  telegram_user_id BIGINT PRIMARY KEY,
  saju_result JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals: referee came via referrer's link (t.me/kismet_saju_bot?start=ref_<referrer_id>)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referee_telegram_id BIGINT NOT NULL,
  referrer_telegram_id BIGINT NOT NULL,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referee_telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_telegram_id);

-- Free talisman credits (e.g. from referral reward)
CREATE TABLE IF NOT EXISTS user_credits (
  telegram_user_id BIGINT PRIMARY KEY,
  free_talisman_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
