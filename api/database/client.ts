/**
 * Database Client - Abstração para Turso/SQLite
 */

import { createClient } from '@libsql/client';

export interface QueryObject {
  sql: string;
  args?: (string | number | boolean | null)[];
}

export type QueryInput = string | QueryObject;

export class DatabaseClient {
  private db: ReturnType<typeof createClient> | null = null;
  private connected = false;

  /**
   * Inicializa conexão com o banco de dados
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    const url = process.env.TURSO_DATABASE_URL || process.env.druidtickets_TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN || process.env.druidtickets_TURSO_AUTH_TOKEN;
    const isLocalFile = url?.startsWith('file:');

    if (!url) {
      throw new Error(
        'CRITICAL: Set TURSO_DATABASE_URL (Turso libsql URL or file:/path/to/db.db for SQLite).'
      );
    }
    if (!isLocalFile && !token) {
      throw new Error(
        'CRITICAL: Turso requires TURSO_AUTH_TOKEN when using a remote URL.'
      );
    }

    try {
      console.log('Connecting to database...');
      this.db = createClient(
        isLocalFile ? { url } : { url, authToken: token }
      );

      // Test connection
      await this.execute('SELECT 1');
      this.connected = true;
      console.log('Database connected successfully.');
    } catch (error) {
      console.error('CRITICAL: Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Executa uma query e retorna resultados tipados
   */
  async execute<T = any>(query: QueryInput): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }

    try {
      const result = await this.db.execute(query);
      return (result.rows as T[]) || [];
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Executa múltiplas queries em uma transação
   */
  async batch(statements: QueryInput[], mode: 'read' | 'write' = 'write'): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }

    try {
      return await this.db.batch(statements, mode);
    } catch (error) {
      console.error('Batch execution failed:', error);
      throw error;
    }
  }

  /**
   * Executa schema initialization
   */
  async initializeSchema(): Promise<void> {
    const statements = [
      {
        sql: `CREATE TABLE IF NOT EXISTS codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          link TEXT NOT NULL,
          is_used BOOLEAN DEFAULT 0,
          used_at DATETIME,
          ip_address TEXT
        )`,
      },
      { sql: `CREATE INDEX IF NOT EXISTS idx_code ON codes(code)` },
      {
        sql: `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS brute_force_attempts (
          ip TEXT PRIMARY KEY,
          attempts INTEGER DEFAULT 0,
          last_attempt DATETIME,
          blocked_until DATETIME
        )`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS import_jobs (
          id TEXT PRIMARY KEY,
          status TEXT DEFAULT 'pending',
          total_lines INTEGER DEFAULT 0,
          processed_lines INTEGER DEFAULT 0,
          successful_lines INTEGER DEFAULT 0,
          failed_lines INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          error_message TEXT
        )`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS user_admin (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS admin_login_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      { sql: `CREATE INDEX IF NOT EXISTS idx_admin_login_codes_email ON admin_login_codes(email)` },
      { sql: `CREATE INDEX IF NOT EXISTS idx_admin_login_codes_expires ON admin_login_codes(expires_at)` },
      { sql: `INSERT INTO user_admin (nome, email) SELECT 'Admin', 'admin@example.com' WHERE (SELECT COUNT(*) FROM user_admin) = 0` },
      { sql: `INSERT OR IGNORE INTO user_admin (nome, email) VALUES ('Thalles', 'thallesfreitas@gmail.com')` },
      { sql: `INSERT OR IGNORE INTO user_admin (nome, email) VALUES ('admin', 'admin@velethuadr.resend.app')` },
      { sql: `INSERT OR IGNORE INTO settings (key, value) VALUES ('start_date', '')` },
      { sql: `INSERT OR IGNORE INTO settings (key, value) VALUES ('end_date', '')` },
    ];

    try {
      await this.batch(statements, 'write');
      console.log('Database schema initialized successfully.');
    } catch (error) {
      console.error('Schema initialization failed:', error);
      throw error;
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Fecha conexão (if needed)
   */
  async disconnect(): Promise<void> {
    if (this.db) {
      this.connected = false;
      // LibSQL client doesn't have explicit disconnect, but we reset reference
      this.db = null;
    }
  }
}

// Singleton instance
export const dbClient = new DatabaseClient();
