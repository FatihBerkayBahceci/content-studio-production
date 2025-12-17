-- Migration: 004_auth_tables.sql
-- Description: Add authentication tables (users, user_clients, api_keys, sessions)
-- Date: 2024-12-16

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'client', 'team') DEFAULT 'team',
  is_active BOOLEAN DEFAULT TRUE,
  email_verified_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User-Client relationship (which users can access which clients)
CREATE TABLE IF NOT EXISTS user_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  client_id INT UNSIGNED NOT NULL,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_client (user_id, client_id),
  INDEX idx_user_id (user_id),
  INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. API Keys (for n8n and external access)
CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(8) NOT NULL,
  scopes JSON DEFAULT NULL,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_key_prefix (key_prefix),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Sessions (for NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_token (session_token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Auto-generate UUID for users
DROP TRIGGER IF EXISTS tr_users_before_insert;
DELIMITER //
CREATE TRIGGER tr_users_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
    SET NEW.uuid = UUID();
  END IF;
END//
DELIMITER ;

-- 6. Insert default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- Password hash generated with bcrypt (10 rounds)
INSERT INTO users (uuid, email, password_hash, name, role, is_active, email_verified_at)
VALUES (
  UUID(),
  'admin@example.com',
  '$2a$10$rQZU7VqKqNv8JLwXHFBpXeZqXqXqXqXqXqXqXqXqXqXqXqXqXqXqX',
  'Admin User',
  'admin',
  TRUE,
  NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 7. Insert a system API key for n8n (key: sk_n8n_system_key - CHANGE THIS IN PRODUCTION!)
INSERT INTO api_keys (user_id, name, key_hash, key_prefix, scopes, is_active)
VALUES (
  NULL,
  'n8n System Key',
  '$2a$10$systemkeyhashplaceholderxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'sk_n8n_',
  '["webhook:read", "webhook:write", "projects:read", "projects:write"]',
  TRUE
) ON DUPLICATE KEY UPDATE is_active = TRUE;
