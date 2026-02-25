/**
 * Public API Services - Serviços públicos do frontend
 */

import { ApiClient } from './client';
import { Settings, RedeemResult, Stats } from '../../types/api';
import { API_PATHS } from '../../constants/api';

export class PublicService {
  constructor(private client: ApiClient) { }

  /**
   * Obtém configurações da promoção
   */
  async getSettings(): Promise<Settings> {
    return this.client.get<Settings>(API_PATHS.PUBLIC.SETTINGS);
  }

  /**
   * Resgata um código
   */
  async redeem(code: string, captchaToken: string): Promise<RedeemResult> {
    console.log('redeem', code, captchaToken);
    console.log('API_PATHS.PUBLIC.REDEEM', API_PATHS.PUBLIC.REDEEM);
    console.log('code', code);
    console.log('captchaToken', captchaToken);
    return this.client.post<RedeemResult>(API_PATHS.PUBLIC.REDEEM, {
      code: code.toUpperCase(),
      captchaToken,
    });
  }

  /**
   * Obtém estatísticas
   */
  async getStats(): Promise<Stats> {
    return this.client.get<Stats>(API_PATHS.PUBLIC.STATS);
  }
}
