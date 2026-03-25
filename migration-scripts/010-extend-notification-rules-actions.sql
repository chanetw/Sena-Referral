-- Migration: Extend notification_rules action_type for customer pass/fail notifications
-- Created: 2026-03-25

ALTER TABLE notification_rules
  MODIFY COLUMN action_type ENUM(
    'customer_created',
    'agent_registered',
    'customer_approved',
    'customer_rejected'
  ) NOT NULL;
