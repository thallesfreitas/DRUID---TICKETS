/**
 * StatsService - Estatísticas e relatórios
 */

import { DatabaseClient } from '../database/client.js';
import { Stats } from '../types/index.js';
import { QUERIES } from '../constants/queries.js';

export class StatsService {
  constructor(private db: DatabaseClient) {}

  /**
   * Obtém estatísticas completas
   */
  async getStats(): Promise<Stats> {
    const totalResult = await this.db.execute<{ count: number }>(QUERIES.COUNT_TOTAL_CODES);
    const usedResult = await this.db.execute<{ count: number }>(QUERIES.COUNT_USED_CODES);
    const phase2Result = await this.db.execute<{ count: number }>(QUERIES.COUNT_EMAIL_REDEMPTIONS);
    const recentResult = await this.db.execute<{
      code: string;
      ip_address: string | null;
      used_at: string;
    }>(QUERIES.GET_RECENT_REDEEMS);

    const total = Math.max(0, Number(totalResult[0]?.count ?? 0));
    const used = Math.max(0, Number(usedResult[0]?.count ?? 0));
    const usedPhase2 = Math.max(0, Number(phase2Result[0]?.count ?? 0));
    const usedPhase1 = Math.max(0, used - usedPhase2);

    return {
      total,
      used,
      used_phase1: usedPhase1,
      used_phase2: usedPhase2,
      available: total - used,
      recent: recentResult,
    };
  }
}
