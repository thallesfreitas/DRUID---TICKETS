/**
 * Public API Services - Serviços públicos do frontend
 */

import { ApiClient } from './client';
import { Settings, RedeemResult, Stats, VerificationRequestResult } from '../../types/api';
import { API_PATHS } from '../../constants/api';

export class PublicService {
  constructor(private client: ApiClient) { }

  /**
   * Obtém configurações da promoção
   */
  async getSettings(): Promise<Settings> {
    return this.client.get<Settings>(API_PATHS.PUBLIC.SETTINGS);
  }

  async requestVerification(
    promoCode: string,
    email: string,
    captchaToken: string
  ): Promise<VerificationRequestResult> {
    return this.client.post<VerificationRequestResult>(API_PATHS.PUBLIC.REQUEST_VERIFICATION, {
      promoCode: promoCode.toUpperCase(),
      email,
      captchaToken,
    });
  }

  async redeemInfluencer(email: string, verificationCode: string): Promise<RedeemResult> {
    return this.client.post<RedeemResult>(API_PATHS.PUBLIC.REDEEM_INFLUENCER, {
      email,
      verificationCode,
    });
  }

  /**
   * Obtém estatísticas
   */
  async getStats(): Promise<Stats> {
    return this.client.get<Stats>(API_PATHS.PUBLIC.STATS);
  }
}
