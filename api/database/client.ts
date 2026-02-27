/**
 * Database Client - Abstração para PostgreSQL (pg)
 */

import pg from 'pg';
const { Pool } = pg;

export interface QueryObject {
  sql: string;
  args?: (string | number | boolean | null)[];
}

export type QueryInput = string | QueryObject;

export class DatabaseClient {
  private pool: pg.Pool | null = null;
  private connected = false;

  /**
   * Inicializa conexão com o banco de dados PostgreSQL
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    const databaseUrl = process.env.DATABASE_URL;

    const config: pg.PoolConfig = databaseUrl
      ? { connectionString: databaseUrl }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || 'promocode',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
        };

    try {
      console.log('Connecting to PostgreSQL...');
      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      client.release();
      this.connected = true;
      console.log('PostgreSQL connected successfully.');
    } catch (error) {
      console.error('CRITICAL: PostgreSQL connection failed:', error);
      throw error;
    }
  }

  /**
   * Executa uma query e retorna resultados tipados
   */
  async execute<T = any>(query: QueryInput): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    try {
      const { text, values } = this.normalizeQuery(query);
      const result = await this.pool.query(text, values);
      return (result.rows as T[]) || [];
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Executa múltiplas queries em uma transação
   */
  async batch(statements: QueryInput[], _mode: 'read' | 'write' = 'write'): Promise<any[]> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();
    const results: any[] = [];

    try {
      await client.query('BEGIN');

      for (const stmt of statements) {
        const { text, values } = this.normalizeQuery(stmt);
        const result = await client.query(text, values);
        results.push({
          rows: result.rows,
          rowsAffected: result.rowCount ?? 0,
        });
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Batch execution failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Executa schema initialization (PostgreSQL)
   */
  async initializeSchema(): Promise<void> {
    const statements: QueryObject[] = [
      {
        sql: `CREATE TABLE IF NOT EXISTS codes (
          id SERIAL PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          link TEXT NOT NULL,
          is_used BOOLEAN DEFAULT false,
          used_at TIMESTAMPTZ,
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
          last_attempt TIMESTAMPTZ,
          blocked_until TIMESTAMPTZ
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
          created_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          error_message TEXT
        )`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS user_admin (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS admin_login_codes (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
      },
      { sql: `CREATE INDEX IF NOT EXISTS idx_admin_login_codes_email ON admin_login_codes(email)` },
      { sql: `CREATE INDEX IF NOT EXISTS idx_admin_login_codes_expires ON admin_login_codes(expires_at)` },
      {
        sql: `INSERT INTO user_admin (nome, email)
              SELECT 'Pedro', 'pedro@rais.com.br'
              WHERE NOT EXISTS (SELECT 1 FROM user_admin LIMIT 1)`,
      },
      {
        sql: `INSERT INTO user_admin (nome, email)
              VALUES ('Thalles', 'thallesfreitas@gmail.com')
              ON CONFLICT (email) DO NOTHING`,
      },
      {
        sql: `INSERT INTO settings (key, value) VALUES ('start_date', '') ON CONFLICT (key) DO NOTHING`,
      },
      {
        sql: `INSERT INTO settings (key, value) VALUES ('end_date', '') ON CONFLICT (key) DO NOTHING`,
      },
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
   * Fecha conexão
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      this.pool = null;
    }
  }

  /**
   * Normaliza query para formato pg: { text, values }
   */
  private normalizeQuery(query: QueryInput): { text: string; values?: any[] } {
    if (typeof query === 'string') {
      return { text: query };
    }
    return {
      text: query.sql,
      values: query.args ?? undefined,
    };
  }
}

// Singleton instance
export const dbClient = new DatabaseClient();
