-- Video Editor Schema (PostgreSQL style)
-- Simple schema, no foreign keys, following existing project approach

-- 1) User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','vip','standard')),
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- 2) Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- VIP_WEEK, VIP_MONTH, VIP_YEAR, VIP_LIFETIME
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_days INTEGER, -- NULL for lifetime
  is_lifetime BOOLEAN DEFAULT false,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  features JSONB DEFAULT '{}', -- feature flags and limits
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3) User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','canceled','pending')),
  start_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_at TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  payment_gateway VARCHAR(30), -- momo, zalopay, stripe, paypal, ...
  transaction_id VARCHAR(128),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4) Payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  gateway VARCHAR(30) NOT NULL, -- momo, zalopay, stripe, paypal
  transaction_id VARCHAR(128),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- 5) Video Tasks (a task can have many videos)
CREATE TABLE IF NOT EXISTS video_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','processing','completed','failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- 6) Videos (belong to a task)
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  source_url VARCHAR(500),
  storage_path VARCHAR(500),
  filename VARCHAR(255),
  size_bytes BIGINT,
  format VARCHAR(20),
  duration_seconds DECIMAL(10,3),
  width INTEGER,
  height INTEGER,
  fps DECIMAL(6,3),
  audio_channels INTEGER,
  language_code VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- 7) Video Edit Settings (current state/config per video)
CREATE TABLE IF NOT EXISTS video_edit_settings (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL,
  aspect_ratio VARCHAR(10) DEFAULT 'original' CHECK (aspect_ratio IN ('original','16:9','4:3','1:1','9:16','21:9')),
  crop JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  enable_auto_subtitles BOOLEAN DEFAULT false,
  enable_auto_translate BOOLEAN DEFAULT false,
  target_languages TEXT[], -- list of ISO codes
  current_subtitle_lang VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8) Subtitle Tracks (multiple per video, including translations)
CREATE TABLE IF NOT EXISTS subtitle_tracks (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  storage_path VARCHAR(500),
  url VARCHAR(500),
  format VARCHAR(10) DEFAULT 'srt' CHECK (format IN ('srt','vtt')),
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Seed subscription plans (idempotent)
INSERT INTO subscription_plans (code, name, description, duration_days, is_lifetime, price_cents, currency, features, is_active)
VALUES
  ('VIP_WEEK', 'VIP - 1 Week', 'Full features for 7 days', 7, false, 49000, 'VND', '{"features":["full_edit","auto_sub","translate"],"limits":{"tasksPerDay":20}}', true),
  ('VIP_MONTH', 'VIP - 1 Month', 'Full features for 30 days', 30, false, 149000, 'VND', '{"features":["full_edit","auto_sub","translate"],"limits":{"tasksPerDay":100}}', true),
  ('VIP_YEAR', 'VIP - 1 Year', 'Full features for 365 days', 365, false, 990000, 'VND', '{"features":["full_edit","auto_sub","translate"],"limits":{"tasksPerDay":500}}', true),
  ('VIP_LIFETIME', 'VIP - Lifetime', 'Full features forever', NULL, true, 2990000, 'VND', '{"features":["full_edit","auto_sub","translate"],"limits":{}}', true)
ON CONFLICT (code) DO NOTHING;

