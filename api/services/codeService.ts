/**
 * CodeService - Lógica de negócio para gerenciamento de códigos
 */

import { DatabaseClient } from '../database/client.js';
import { Code, PaginatedCodes } from '../types/index.js';
import { QUERIES } from '../constants/queries.js';
import { API_DEFAULTS } from '../constants/api.js';

export class CodeService {
  constructor(private db: DatabaseClient) {}

  /**
   * Busca código por seu valor (string)
   */
  async getByCode(code: string): Promise<Code | null> {
    const results = await this.db.execute<Code>(
      { sql: QUERIES.GET_CODE, args: [code.toUpperCase()] }
    );
    return results[0] || null;
  }

  /**
   * Busca código por ID
   */
  async getById(id: number): Promise<Code | null> {
    const results = await this.db.execute<Code>(
      { sql: QUERIES.GET_CODE_BY_ID, args: [id] }
    );
    return results[0] || null;
  }

  /**
   * Marca código como utilizado
   */
  async markAsUsed(id: number, ip: string): Promise<void> {
    await this.db.execute(
      { sql: QUERIES.UPDATE_CODE_USED, args: [ip, id] }
    );
  }

  async getAll(page: number = 1, search?: string, status?: 'used' | 'available'): Promise<PaginatedCodes> {
    const limit = API_DEFAULTS.CODES_PAGE_SIZE;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const whereArgs: Array<string | boolean> = [];

    if (search) {
      const pattern = `%${search}%`;
      const idx = whereArgs.length + 1;
      whereClauses.push(`(c.code ILIKE $${idx} OR c.ip_address ILIKE $${idx} OR er.email ILIKE $${idx})`);
      whereArgs.push(pattern);
    }

    if (status === 'used') {
      whereClauses.push('(c.is_used = true OR er.id IS NOT NULL)');
    } else if (status === 'available') {
      whereClauses.push('(c.is_used = false AND er.id IS NULL)');
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM codes c
      LEFT JOIN email_redemptions er ON er.code_id = c.id
      ${whereSql}
    `;
    const countResult = await this.db.execute<{ count: number }>({
      sql: countSql,
      args: whereArgs,
    });

    const rowsSql = `
      SELECT
        c.*,
        (er.id IS NOT NULL) AS redeemed_by_email,
        er.email AS redeemed_email
      FROM codes c
      LEFT JOIN email_redemptions er ON er.code_id = c.id
      ${whereSql}
      ORDER BY
        (er.id IS NOT NULL) DESC,
        c.is_used DESC,
        COALESCE(er.redeemed_at, c.used_at) DESC NULLS LAST,
        c.id ASC
      LIMIT $${whereArgs.length + 1}
      OFFSET $${whereArgs.length + 2}
    `;
    const rowsArgs = [...whereArgs, limit, offset];
    const rowsResult = await this.db.execute<Code>({ sql: rowsSql, args: rowsArgs });

    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return {
      codes: rowsResult,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Insere múltiplos códigos (para CSV import) - PostgreSQL
   */
  async insertBatch(codes: Array<{ code: string; link: string }>): Promise<number> {
    const valid = codes.filter(c => c.code && c.link);

    if (valid.length === 0) {
      return 0;
    }

    const statements = valid.map(c => ({
      sql: 'INSERT INTO codes (code, link) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
      args: [c.code.toUpperCase(), c.link],
    }));

    const results = await this.db.batch(statements, 'write');
    return results.filter((r: any) => r.rowsAffected > 0).length;
  }

  /**
   * Obtém estatísticas de códigos
   */
  async getStats(): Promise<{ total: number; used: number; available: number }> {
    const totalResult = await this.db.execute<{ count: number }>(QUERIES.COUNT_TOTAL_CODES);
    const usedResult = await this.db.execute<{ count: number }>(QUERIES.COUNT_USED_CODES);

    const total = Number(totalResult[0]?.count ?? 0);
    const used = Number(usedResult[0]?.count ?? 0);

    return {
      total,
      used,
      available: total - used,
    };
  }

  /**
   * Obtém códigos resgatados recentemente
   */
  async getRecentRedeems(limit: number = 10): Promise<any[]> {
    return this.db.execute(
      { sql: QUERIES.GET_RECENT_REDEEMS }
    );
  }

  /**
   * Obtém códigos resgatados para exportação
   */
  async getRedeemedForExport(): Promise<any[]> {
    return this.db.execute(QUERIES.GET_REDEEMED_CODES);
  }
}
