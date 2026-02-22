/**
 * SQL Queries como constantes (DRY principle)
 */

export const QUERIES = {
  // ===== CODES =====
  GET_CODE: 'SELECT * FROM codes WHERE code = ?',
  GET_CODE_BY_ID: 'SELECT * FROM codes WHERE id = ?',
  GET_ALL_CODES: 'SELECT * FROM codes ORDER BY id DESC LIMIT ? OFFSET ?',
  SEARCH_CODES: 'SELECT * FROM codes WHERE code LIKE ? OR ip_address LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?',
  COUNT_ALL_CODES: 'SELECT COUNT(*) as count FROM codes',
  COUNT_SEARCH_CODES: 'SELECT COUNT(*) as count FROM codes WHERE code LIKE ? OR ip_address LIKE ?',
  UPDATE_CODE_USED: 'UPDATE codes SET is_used = 1, used_at = CURRENT_TIMESTAMP, ip_address = ? WHERE id = ?',

  // ===== SETTINGS =====
  GET_ALL_SETTINGS: 'SELECT * FROM settings',
  GET_SETTING: 'SELECT * FROM settings WHERE key = ?',
  UPDATE_SETTING: 'UPDATE settings SET value = ? WHERE key = ?',
  INSERT_SETTING: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',

  // ===== BRUTE FORCE =====
  GET_BRUTE_FORCE: 'SELECT * FROM brute_force_attempts WHERE ip = ?',
  UPDATE_BRUTE_FORCE: `INSERT INTO brute_force_attempts (ip, attempts, last_attempt, blocked_until)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(ip) DO UPDATE SET
      attempts = excluded.attempts,
      last_attempt = excluded.last_attempt,
      blocked_until = excluded.blocked_until`,
  DELETE_BRUTE_FORCE: 'DELETE FROM brute_force_attempts WHERE ip = ?',

  // ===== IMPORT JOBS =====
  INSERT_IMPORT_JOB: `INSERT INTO import_jobs (id, status, total_lines, processed_lines, successful_lines, failed_lines)
    VALUES (?, 'processing', ?, 0, 0, 0)
    ON CONFLICT(id) DO UPDATE SET status = 'processing'`,
  UPDATE_IMPORT_JOB: `UPDATE import_jobs SET processed_lines = ?, successful_lines = ?, failed_lines = ? WHERE id = ?`,
  GET_IMPORT_JOB: 'SELECT * FROM import_jobs WHERE id = ?',
  UPDATE_IMPORT_JOB_COMPLETED: `UPDATE import_jobs SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
    processed_lines = ?, successful_lines = ?, failed_lines = ? WHERE id = ?`,
  UPDATE_IMPORT_JOB_FAILED: `UPDATE import_jobs SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = ? WHERE id = ?`,

  // ===== STATS =====
  COUNT_TOTAL_CODES: 'SELECT COUNT(*) as count FROM codes',
  COUNT_USED_CODES: 'SELECT COUNT(*) as count FROM codes WHERE is_used = 1',
  GET_RECENT_REDEEMS: `
    SELECT code, ip_address, used_at
    FROM codes
    WHERE is_used = 1
    ORDER BY used_at DESC
    LIMIT 10
  `,

  // ===== EXPORT =====
  GET_REDEEMED_CODES: `
    SELECT code, link, used_at, ip_address
    FROM codes
    WHERE is_used = 1
    ORDER BY used_at DESC
  `,
} as const;

export type QueryKey = keyof typeof QUERIES;
