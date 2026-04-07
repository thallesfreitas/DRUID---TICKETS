/**
 * Lista resgates vinculados a e-mail (email_redemptions + codes)
 */

import { DatabaseClient } from '../database/client.js';
import { PaginatedEmailRedemptions, EmailRedemptionRow } from '../types/index.js';
import { API_DEFAULTS } from '../constants/api.js';

export class EmailRedemptionService {
  constructor(private db: DatabaseClient) {}

  async getPaginated(page: number = 1, search?: string): Promise<PaginatedEmailRedemptions> {
    const limit = API_DEFAULTS.CODES_PAGE_SIZE;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const whereArgs: string[] = [];

    if (search?.trim()) {
      const pattern = `%${search.trim()}%`;
      const i1 = whereArgs.length + 1;
      const i2 = whereArgs.length + 2;
      whereClauses.push(`(er.email ILIKE $${i1} OR c.code ILIKE $${i2})`);
      whereArgs.push(pattern, pattern);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM email_redemptions er
      INNER JOIN codes c ON c.id = er.code_id
      ${whereSql}
    `;
    const countResult = await this.db.execute<{ count: number }>({
      sql: countSql,
      args: whereArgs,
    });
    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const rowsSql = `
      SELECT
        er.id,
        er.email,
        er.redeemed_at,
        c.code AS prize_code,
        c.link AS prize_link
      FROM email_redemptions er
      INNER JOIN codes c ON c.id = er.code_id
      ${whereSql}
      ORDER BY er.redeemed_at DESC NULLS LAST, er.id DESC
      LIMIT $${whereArgs.length + 1}
      OFFSET $${whereArgs.length + 2}
    `;
    const rowsArgs = [...whereArgs, limit, offset];
    const rows = await this.db.execute<EmailRedemptionRow>({ sql: rowsSql, args: rowsArgs });

    return {
      items: rows,
      total,
      page,
      totalPages,
    };
  }
}
