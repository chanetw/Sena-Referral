-- Migration: Replace project_code with ICON project codes, then drop icon_project_code
-- Generated: 2026-04-01
-- Logic: Copy icon_project_code → project_code for rows that have it
--        7 rows without icon_project_code keep their existing project_code (PROJ006 etc.)
--        Then drop the icon_project_code column

-- Step 0: Merge duplicate projects before replacing codes
-- Pair 1: ID 42 & 44 both = SKHPT (เสนาคิทท์ รัตนาธิเบศร์-บางบัวทอง) → keep 42
UPDATE customers SET project_id = 42 WHERE project_id = 44;
DELETE FROM projects WHERE id = 44;

-- Pair 2: ID 37 & 65 both = 00601 (เสนา อเวนิว บางปะกง - บ้านโพธิ์) → keep 37
-- (ID 65 has 0 customers, safe to delete)
DELETE FROM projects WHERE id = 65;

-- Step 1: Copy ICON codes into project_code (only where icon_project_code is NOT NULL)
UPDATE projects
SET project_code = icon_project_code
WHERE icon_project_code IS NOT NULL;

-- Step 2: Drop the icon_project_code column (no longer needed)
ALTER TABLE projects DROP COLUMN icon_project_code;
