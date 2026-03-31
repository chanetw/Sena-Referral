-- Add auto-generated referral code to agents table
-- Each agent gets a unique 6-char code (alphanumeric, easy-to-type charset, no O I L 0 1)
-- Run BEFORE deploying updated backend code.

ALTER TABLE agents
  ADD COLUMN ref_code VARCHAR(10) UNIQUE NULL AFTER agent_code;

-- Backfill existing agents via the POST /api/agents/backfill-ref-codes endpoint
-- (The backend will call this after migration to generate codes for existing rows)
