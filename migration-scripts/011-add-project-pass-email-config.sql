-- Add per-project pass-email configuration
-- Run this on existing databases before deploying updated backend/frontend code.

ALTER TABLE projects
ADD COLUMN pass_email_enabled BOOLEAN NOT NULL DEFAULT false AFTER is_active,
ADD COLUMN pass_email_recipients TEXT NULL AFTER pass_email_enabled;
