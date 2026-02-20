PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        link TEXT NOT NULL,
        is_used BOOLEAN DEFAULT 0,
        used_at DATETIME,
        ip_address TEXT
      );
CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
INSERT INTO settings VALUES('start_date','');
INSERT INTO settings VALUES('end_date','');
CREATE TABLE brute_force_attempts (
        ip TEXT PRIMARY KEY,
        attempts INTEGER DEFAULT 0,
        last_attempt DATETIME,
        blocked_until DATETIME
      );
INSERT INTO brute_force_attempts VALUES('127.0.0.1',1,'2026-02-20T13:48:34.491Z',NULL);
CREATE TABLE import_jobs (
        id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'pending',
        total_lines INTEGER DEFAULT 0,
        processed_lines INTEGER DEFAULT 0,
        successful_lines INTEGER DEFAULT 0,
        failed_lines INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        error_message TEXT
      );
DELETE FROM sqlite_sequence;
CREATE INDEX idx_code ON codes(code);
COMMIT;
