-- Migration: Add short_code to agent_types for new agent code format
-- Format: {TYPE}{YY}{ALPHA}{NUM} e.g. ST26A001
-- Date: 2026-03-31

ALTER TABLE agent_types ADD COLUMN short_code VARCHAR(2) NOT NULL DEFAULT 'GN' AFTER code;

UPDATE agent_types SET short_code = 'SN' WHERE code = 'resident';
UPDATE agent_types SET short_code = 'LN' WHERE code = 'livnex_customer';
UPDATE agent_types SET short_code = 'RN' WHERE code = 'rentnex_customer';
UPDATE agent_types SET short_code = 'ST' WHERE code = 'sena_staff';
UPDATE agent_types SET short_code = 'PT' WHERE code = 'partner';
UPDATE agent_types SET short_code = 'GN' WHERE code = 'general';
UPDATE agent_types SET short_code = 'UN' WHERE code = 'legacy_unknown';

ALTER TABLE agent_types ADD UNIQUE KEY uk_short_code (short_code);
