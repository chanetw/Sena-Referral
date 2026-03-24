-- One-time fix for mojibake Thai text stored as UTF-8 bytes interpreted via latin1
-- Safe guard: only updates rows containing common mojibake markers (à¸ / à¹ / Ã)

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

UPDATE agents
SET
    first_name = CONVERT(BINARY CONVERT(first_name USING latin1) USING utf8mb4),
    last_name = CONVERT(BINARY CONVERT(last_name USING latin1) USING utf8mb4),
    address = CONVERT(BINARY CONVERT(address USING latin1) USING utf8mb4)
WHERE
    first_name LIKE '%à¸%' OR first_name LIKE '%à¹%' OR first_name LIKE '%Ã%'
    OR last_name LIKE '%à¸%' OR last_name LIKE '%à¹%' OR last_name LIKE '%Ã%'
    OR address LIKE '%à¸%' OR address LIKE '%à¹%' OR address LIKE '%Ã%';

UPDATE customers
SET
    first_name = CONVERT(BINARY CONVERT(first_name USING latin1) USING utf8mb4),
    last_name = CONVERT(BINARY CONVERT(last_name USING latin1) USING utf8mb4),
    notes = CONVERT(BINARY CONVERT(notes USING latin1) USING utf8mb4)
WHERE
    first_name LIKE '%à¸%' OR first_name LIKE '%à¹%' OR first_name LIKE '%Ã%'
    OR last_name LIKE '%à¸%' OR last_name LIKE '%à¹%' OR last_name LIKE '%Ã%'
    OR notes LIKE '%à¸%' OR notes LIKE '%à¹%' OR notes LIKE '%Ã%';

UPDATE leads
SET
    first_name = CONVERT(BINARY CONVERT(first_name USING latin1) USING utf8mb4),
    last_name = CONVERT(BINARY CONVERT(last_name USING latin1) USING utf8mb4),
    notes = CONVERT(BINARY CONVERT(notes USING latin1) USING utf8mb4)
WHERE
    first_name LIKE '%à¸%' OR first_name LIKE '%à¹%' OR first_name LIKE '%Ã%'
    OR last_name LIKE '%à¸%' OR last_name LIKE '%à¹%' OR last_name LIKE '%Ã%'
    OR notes LIKE '%à¸%' OR notes LIKE '%à¹%' OR notes LIKE '%Ã%';
