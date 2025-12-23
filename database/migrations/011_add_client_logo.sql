-- Migration: Add logo_url column to clients table
-- Date: 2024-12-22

ALTER TABLE clients
ADD COLUMN logo_url VARCHAR(500) NULL COMMENT 'Client logo URL (1200x1200)' AFTER domain;
