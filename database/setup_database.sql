-- PostgreSQL Database Setup Script for Video Editor
-- No foreign keys, simple structure

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT false,
    provider VARCHAR(50) DEFAULT 'local',
    provider_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    phone_number VARCHAR(20),
    address TEXT,
    sub VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    is_sso BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}'
);

-- 2. User roles
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

-- 3. Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_days INTEGER,
    is_lifetime BOOLEAN DEFAULT false,
    price_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','canceled','pending')),
    start_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_at TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT false,
    payment_gateway VARCHAR(30),
    transaction_id VARCHAR(128),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
    gateway VARCHAR(30) NOT NULL,
    transaction_id VARCHAR(128),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- 6. Video tasks
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

-- 7. Videos
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
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- 8. Video edit settings
CREATE TABLE IF NOT EXISTS video_edit_settings (
    id SERIAL PRIMARY KEY,
    video_id INTEGER NOT NULL,
    aspect_ratio VARCHAR(10) DEFAULT 'original' CHECK (aspect_ratio IN ('original','16:9','4:3','1:1','9:16','21:9')),
    crop JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    enable_auto_subtitles BOOLEAN DEFAULT false,
    enable_auto_translate BOOLEAN DEFAULT false,
    target_languages TEXT[],
    current_subtitle_lang VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Subtitle tracks
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

-- 10. Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_video_tasks_user_id ON video_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_videos_task_id ON videos (task_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions (user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (code, name, description, duration_days, is_lifetime, price_cents, currency, features, is_active)
VALUES
    ('VIP_WEEK', 'VIP - 1 Week', 'Full features for 7 days', 7, false, 49000, 'VND', '{"features":["full_edit","auto_sub","translate"],"limits":{"tasksPerDay":20}}', true),
    ('VIP_MONTH', 'VIP - 1 Month', 'Full features for 30 days', 30, false, 149000, 'VND', '{"features":["full_edit","auto_sub","translate"],"limits":{"tasksPerDay":100}}', true),
    ('VIP_YEAR', 'VIP - 1 Year', 'Full features for 365 days', 365, false, 990000, 'VND', '{"features":["full_edit","auto_sub","translate"],"limits":{"tasksPerDay":500}}', true),
    ('VIP_LIFETIME', 'VIP - Lifetime', 'Full features forever', NULL, true, 2990000, 'VND', '{"features":["full_edit","auto_sub","translate"],"limits":{}}', true)
ON CONFLICT (code) DO NOTHING;

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() OR is_revoked = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Show completion message
SELECT 'Video Editor Database Setup Complete!' as message;