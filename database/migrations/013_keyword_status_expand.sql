-- Migration 013: Expand keyword status for trash and negative keywords
-- Date: 2024-12-24
-- Description: Add 'trash' and 'negative' status values, trashed_at timestamp, and index

-- Expand status enum for trash and negative keywords
ALTER TABLE keyword_results
MODIFY COLUMN status ENUM('approved', 'rejected', 'pending', 'trash', 'negative')
DEFAULT 'pending';

-- Add trash timestamp for auto-cleanup tracking
ALTER TABLE keyword_results
ADD COLUMN trashed_at TIMESTAMP NULL DEFAULT NULL;

-- Add index for faster status-based filtering
CREATE INDEX idx_keyword_project_status ON keyword_results(project_id, status);

-- Update existing NULL status to 'approved' for consistency
UPDATE keyword_results SET status = 'approved' WHERE status IS NULL;
