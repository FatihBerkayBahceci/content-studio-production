-- Migration: 010_add_test_role.sql
-- Description: Add 'test' role for limited access users
-- Date: 2024-12-17

-- 1. Alter users table to add 'test' role
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'client', 'team', 'test') DEFAULT 'team';

-- 2. Insert a test user (password: test123)
-- Password hash generated with bcrypt
INSERT INTO users (uuid, email, password_hash, name, role, is_active, email_verified_at)
VALUES (
  UUID(),
  'test@seo.dev',
  '$2b$10$eJRp7ezVKQC8Uazl8Jxl/eURrAK13yPmBnOQlmutyz3l4pr3rkhfC',
  'Test User',
  'test',
  TRUE,
  NOW()
) ON DUPLICATE KEY UPDATE role = 'test', updated_at = NOW();
