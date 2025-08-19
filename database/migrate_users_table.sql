-- Migration: Add missing columns to users table
-- Run this on your PostgreSQL server at 192.168.210.100:5433

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS sub VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by INTEGER,
ADD COLUMN IF NOT EXISTS is_sso BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Update existing users to have default values
UPDATE users SET 
    is_active = true WHERE is_active IS NULL;

UPDATE users SET 
    is_sso = false WHERE is_sso IS NULL;

UPDATE users SET 
    preferences = '{}' WHERE preferences IS NULL;

-- Show updated table structure
\d users;