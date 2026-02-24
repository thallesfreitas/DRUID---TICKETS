/**
 * AdminAuthService - Admin users and one-time login codes
 */

import { DatabaseClient } from '../database/client.js';

export interface UserAdminRow {
  id: number;
  nome: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AdminLoginCodeRow {
  id: number;
  email: string;
  code: string;
  expires_at: string;
  created_at: string;
}

const CODE_TTL_MINUTES = 15;
const CODE_LENGTH = 6;

export class AdminAuthService {
  constructor(private db: DatabaseClient) {}

  // Find admin by email
  async findByEmail(email: string): Promise<UserAdminRow | null> {
    const normalized = email.trim().toLowerCase();
    const rows = await this.db.execute<UserAdminRow>({
      sql: 'SELECT id, nome, email, created_at, updated_at FROM user_admin WHERE LOWER(email) = ? LIMIT 1',
      args: [normalized],
    });
    return rows[0] || null;
  }

  // Generate numeric code and save with TTL
  async createLoginCode(email: string): Promise<{ code: string; expiresAt: string }> {
    const normalized = email.trim().toLowerCase();
    const code = Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * 10)).join('');
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    const expiresStr = expiresAt.toISOString().replace('T', ' ').slice(0, 19);
    await this.db.execute({
      sql: 'INSERT INTO admin_login_codes (email, code, expires_at) VALUES (?, ?, ?)',
      args: [normalized, code, expiresStr],
    });
    return { code, expiresAt: expiresStr };
  }

  // Find valid (non-expired) code for email
  async findValidCode(email: string, code: string): Promise<AdminLoginCodeRow | null> {
    const normalized = email.trim().toLowerCase();
    const rows = await this.db.execute<AdminLoginCodeRow>({
      sql: `SELECT id, email, code, expires_at, created_at FROM admin_login_codes
            WHERE LOWER(email) = ? AND code = ? AND datetime(expires_at) > datetime('now') LIMIT 1`,
      args: [normalized, code.trim()],
    });
    return rows[0] || null;
  }

  // Invalidate code after successful use
  async deleteCode(id: number): Promise<void> {
    await this.db.execute({ sql: 'DELETE FROM admin_login_codes WHERE id = ?', args: [id] });
  }

  // Clean expired codes (optional, can be called periodically)
  async cleanupExpiredCodes(): Promise<void> {
    await this.db.execute({ sql: `DELETE FROM admin_login_codes WHERE datetime(expires_at) <= datetime('now')` });
  }
}
