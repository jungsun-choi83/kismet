-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone_name TEXT,
  gender TEXT NOT NULL,
  calendar_type TEXT DEFAULT 'solar',
  saju_result JSONB,
  free_trial_used BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Talismans table
CREATE TABLE IF NOT EXISTS talismans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  telegram_id BIGINT NOT NULL,
  wish TEXT,
  style TEXT,
  image_url TEXT,
  guide TEXT,
  payment_charge_id TEXT,
  stars_paid INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily fortunes table
CREATE TABLE IF NOT EXISTS daily_fortunes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  fortune JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_payment_charge_id TEXT UNIQUE NOT NULL,
  telegram_id BIGINT NOT NULL,
  product TEXT,
  stars_paid INTEGER,
  payload JSONB,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security) - adjust policies as needed for your setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_fortunes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
