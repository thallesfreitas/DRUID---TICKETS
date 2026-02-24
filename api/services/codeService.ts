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

  /**
   * Busca códigos com paginação e filtro
   */
  async getAll(page: number = 1, search?: string): Promise<PaginatedCodes> {
    const limit = API_DEFAULTS.CODES_PAGE_SIZE;
    const offset = (page - 1) * limit;

    let countResult;
    let rowsResult;

    if (search) {
      const searchPattern = `%${search}%`;
      countResult = await this.db.execute<{ count: number }>(
        { sql: QUERIES.COUNT_SEARCH_CODES, args: [searchPattern, searchPattern] }
      );
      rowsResult = await this.db.execute<Code>(
        { sql: QUERIES.SEARCH_CODES, args: [searchPattern, searchPattern, limit, offset] }
      );
    } else {
      countResult = await this.db.execute<{ count: number }>(QUERIES.COUNT_ALL_CODES);
      rowsResult = await this.db.execute<Code>(
        { sql: QUERIES.GET_ALL_CODES, args: [limit, offset] }
      );
    }

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      codes: rowsResult,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Insere múltiplos códigos (para CSV import)
   */
  async insertBatch(codes: Array<{ code: string; link: string }>): Promise<number> {
    const statements = codes
      .filter(c => c.code && c.link) // Remove inválidos
      .map(c => ({
        sql: 'INSERT OR IGNORE INTO codes (code, link) VALUES (?, ?)',
        args: [c.code.toUpperCase(), c.link],
      }));

    if (statements.length === 0) {
      return 0;
    }

    const results = await this.db.batch(statements, 'write');
    return results.filter((r: any) => r.rowsAffected > 0).length;
  }

  /**
   * Obtém estatísticas de códigos
   */
  async getStats(): Promise<{ total: number; used: number; available: number }> {
    const totalResult = await this.db.execute<{ count: number }>(QUERIES.COUNT_TOTAL_CODES);
    const usedResult = await this.db.execute<{ count: number }>(QUERIES.COUNT_USED_CODES);

    const total = totalResult[0]?.count || 0;
    const used = usedResult[0]?.count || 0;

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
