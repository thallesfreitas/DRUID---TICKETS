/**
 * SQL Queries como constantes (DRY principle) - PostgreSQL
 */

export const QUERIES = {
  // ===== CODES =====
  GET_CODE: 'SELECT * FROM codes WHERE code = $1',
  GET_CODE_BY_ID: 'SELECT * FROM codes WHERE id = $1',
  GET_ALL_CODES: 'SELECT * FROM codes ORDER BY id ASC LIMIT $1 OFFSET $2',
  SEARCH_CODES: 'SELECT * FROM codes WHERE code LIKE $1 OR ip_address LIKE $2 ORDER BY id ASC LIMIT $3 OFFSET $4',
  COUNT_ALL_CODES: 'SELECT COUNT(*) as count FROM codes',
  COUNT_SEARCH_CODES: 'SELECT COUNT(*) as count FROM codes WHERE code LIKE $1 OR ip_address LIKE $2',
  UPDATE_CODE_USED: 'UPDATE codes SET is_used = true, used_at = NOW(), ip_address = $1 WHERE id = $2',

  // ===== SETTINGS =====
  GET_ALL_SETTINGS: 'SELECT * FROM settings',
  GET_SETTING: 'SELECT * FROM settings WHERE key = $1',
  UPDATE_SETTING: 'UPDATE settings SET value = $1 WHERE key = $2',
  INSERT_SETTING: 'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',

  // ===== BRUTE FORCE =====
  GET_BRUTE_FORCE: 'SELECT * FROM brute_force_attempts WHERE ip = $1',
  UPDATE_BRUTE_FORCE: `INSERT INTO brute_force_attempts (ip, attempts, last_attempt, blocked_until)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (ip) DO UPDATE SET
      attempts = EXCLUDED.attempts,
      last_attempt = EXCLUDED.last_attempt,
      blocked_until = EXCLUDED.blocked_until`,
  DELETE_BRUTE_FORCE: 'DELETE FROM brute_force_attempts WHERE ip = $1',

  // ===== IMPORT JOBS =====
  INSERT_IMPORT_JOB: `INSERT INTO import_jobs (id, status, total_lines, processed_lines, successful_lines, failed_lines)
    VALUES ($1, 'processing', $2, 0, 0, 0)
    ON CONFLICT (id) DO UPDATE SET status = 'processing'`,
  UPDATE_IMPORT_JOB: `UPDATE import_jobs SET processed_lines = $1, successful_lines = $2, failed_lines = $3 WHERE id = $4`,
  GET_IMPORT_JOB: 'SELECT * FROM import_jobs WHERE id = $1',
  UPDATE_IMPORT_JOB_COMPLETED: `UPDATE import_jobs SET status = 'completed', completed_at = NOW(),
    processed_lines = $1, successful_lines = $2, failed_lines = $3 WHERE id = $4`,
  UPDATE_IMPORT_JOB_FAILED: `UPDATE import_jobs SET status = 'failed', completed_at = NOW(), error_message = $1 WHERE id = $2`,

  // ===== STATS =====
  COUNT_TOTAL_CODES: 'SELECT COUNT(*) as count FROM codes',
  COUNT_USED_CODES: 'SELECT COUNT(*) as count FROM codes WHERE is_used = true',
  GET_RECENT_REDEEMS: `
    SELECT code, ip_address, used_at
    FROM codes
    WHERE is_used = true
    ORDER BY used_at DESC
    LIMIT 10
  `,

  // ===== EXPORT =====
  GET_REDEEMED_CODES: `
    SELECT code, link, used_at, ip_address
    FROM codes
    WHERE is_used = true
    ORDER BY used_at DESC
  `,
} as const;

export type QueryKey = keyof typeof QUERIES;
