-- User reading limits and unlock status
-- Add columns to existing users table or create new table

-- Option 1: Add to existing users table (if exists)
DO $$ 
BEGIN
  -- Free readings count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'free_readings_used') THEN
    ALTER TABLE users ADD COLUMN free_readings_used INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- Daily reading limits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_readings_count') THEN
    ALTER TABLE users ADD COLUMN daily_readings_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_readings_date') THEN
    ALTER TABLE users ADD COLUMN daily_readings_date DATE;
  END IF;
  
  -- Daily talisman limits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_talisman_count') THEN
    ALTER TABLE users ADD COLUMN daily_talisman_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_talisman_date') THEN
    ALTER TABLE users ADD COLUMN daily_talisman_date DATE;
  END IF;
  
  -- Unlock status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'unlocked_full_reading') THEN
    ALTER TABLE users ADD COLUMN unlocked_full_reading BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'unlocked_talisman') THEN
    ALTER TABLE users ADD COLUMN unlocked_talisman BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Option 2: Create separate user_limits table (if users table doesn't exist or prefer separate)
CREATE TABLE IF NOT EXISTS user_limits (
  telegram_user_id BIGINT PRIMARY KEY,
  free_readings_used INTEGER NOT NULL DEFAULT 0,
  daily_readings_count INTEGER NOT NULL DEFAULT 0,
  daily_readings_date DATE,
  daily_talisman_count INTEGER NOT NULL DEFAULT 0,
  daily_talisman_date DATE,
  unlocked_full_reading BOOLEAN NOT NULL DEFAULT false,
  unlocked_talisman BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_limits_telegram_user ON user_limits(telegram_user_id);
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
