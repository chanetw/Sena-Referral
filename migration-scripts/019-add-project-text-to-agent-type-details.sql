-- Migration 019: Add project_text to agent_type_details
-- Created: 2026-04-07
-- Purpose: keep projectId as FK for internal forms, while stamping/storing project name as text for external/API flows

ALTER TABLE agent_type_details
  ADD COLUMN project_text VARCHAR(255) NULL DEFAULT NULL
    COMMENT 'ชื่อโครงการแบบ text ที่ stamp จาก project_id หรือรับตรงจาก API'
    AFTER project_id;
