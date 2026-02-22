/**
 * BruteForceService - Proteção contra ataques de força bruta
 */

import { DatabaseClient } from '../database/client';
import { BruteForceAttempt, AppError } from '../types';
import { QUERIES } from '../constants/queries';
import { ERROR_CODES, HTTP_STATUS, API_DEFAULTS } from '../constants/api';
import { ERROR_MESSAGES } from '../constants/messages';

export class BruteForceService {
  constructor(private db: DatabaseClient) {}

  /**
   * Obtém tentativas de um IP
   */
  async getAttempts(ip: string): Promise<BruteForceAttempt | null> {
    const results = await this.db.execute<BruteForceAttempt>(
      { sql: QUERIES.GET_BRUTE_FORCE, args: [ip] }
    );
    return results[0] || null;
  }

  /**
   * Verifica se um IP está bloqueado
   */
  async isBlocked(ip: string): Promise<{ blocked: boolean; minutesRemaining?: number }> {
    const attempt = await this.getAttempts(ip);

    if (!attempt || !attempt.blocked_until) {
      return { blocked: false };
    }

    const now = new Date();
    const blockedUntil = new Date(attempt.blocked_until);

    if (blockedUntil <= now) {
      return { blocked: false };
    }

    const minutesRemaining = Math.ceil((blockedUntil.getTime() - now.getTime()) / 60000);
    return { blocked: true, minutesRemaining };
  }

  /**
   * Registra tentativa falhada
   */
  async recordFailedAttempt(ip: string): Promise<{ blocked: boolean; minutesRemaining?: number }> {
    const attempt = await this.getAttempts(ip);
    const newAttempts = (attempt?.attempts || 0) + 1;
    const now = new Date();

    let blockedUntil: string | null = null;

    if (newAttempts >= API_DEFAULTS.BRUTE_FORCE_MAX_ATTEMPTS) {
      const blockDate = new Date();
      blockDate.setMinutes(blockDate.getMinutes() + API_DEFAULTS.BRUTE_FORCE_BLOCK_DURATION_MIN);
      blockedUntil = blockDate.toISOString();
    }

    await this.db.execute({
      sql: QUERIES.UPDATE_BRUTE_FORCE,
      args: [ip, newAttempts, now.toISOString(), blockedUntil],
    });

    if (blockedUntil) {
      return { blocked: true, minutesRemaining: API_DEFAULTS.BRUTE_FORCE_BLOCK_DURATION_MIN };
    }

    return { blocked: false };
  }

  /**
   * Limpa tentativas (sucesso)
   */
  async clearAttempts(ip: string): Promise<void> {
    await this.db.execute(
      { sql: QUERIES.DELETE_BRUTE_FORCE, args: [ip] }
    );
  }
}
