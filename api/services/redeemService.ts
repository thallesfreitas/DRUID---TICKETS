/**
 * RedeemService - Lógica de resgate de códigos
 */

import { RedeemResponse, AppError } from '../types';
import { ERROR_CODES, HTTP_STATUS } from '../constants/api';
import { ERROR_MESSAGES } from '../constants/messages';
import { CodeService } from './codeService';
import { SettingsService } from './settingsService';
import { BruteForceService } from './bruteForceService';

export class RedeemService {
  constructor(
    private codeService: CodeService,
    private settingsService: SettingsService,
    private bruteForceService: BruteForceService
  ) {}

  /**
   * Processa resgate de um código
   */
  async redeem(code: string, ip: string): Promise<RedeemResponse> {
    // 1. Validar se promoção começou/terminou
    const isStarted = await this.settingsService.isStarted();
    if (!isStarted) {
      throw new AppError(
        ERROR_MESSAGES.PROMO_NOT_STARTED,
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.PROMO_NOT_STARTED
      );
    }

    const isEnded = await this.settingsService.isEnded();
    if (isEnded) {
      throw new AppError(
        ERROR_MESSAGES.PROMO_ENDED,
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.PROMO_ENDED
      );
    }

    // 2. Verificar se IP está bloqueado
    const { blocked, minutesRemaining } = await this.bruteForceService.isBlocked(ip);
    if (blocked) {
      throw new AppError(
        ERROR_MESSAGES.IP_BLOCKED.replace('{minutes}', String(minutesRemaining)),
        HTTP_STATUS.RATE_LIMIT,
        ERROR_CODES.IP_BLOCKED
      );
    }

    // 3. Buscar código
    const codeRecord = await this.codeService.getByCode(code);

    if (!codeRecord) {
      // Registrar tentativa falhada
      const blockResult = await this.bruteForceService.recordFailedAttempt(ip);

      if (blockResult.blocked) {
        throw new AppError(
          `Muitas tentativas incorretas. Seu acesso foi bloqueado temporariamente.`,
          HTTP_STATUS.RATE_LIMIT,
          ERROR_CODES.IP_BLOCKED
        );
      }

      throw new AppError(
        ERROR_MESSAGES.INVALID_CODE,
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.INVALID_CODE
      );
    }

    // 4. Validar se código já foi utilizado
    if (codeRecord.is_used) {
      throw new AppError(
        ERROR_MESSAGES.CODE_USED,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.CODE_USED
      );
    }

    // 5. Marcar como utilizado
    await this.codeService.markAsUsed(codeRecord.id, ip);

    // 6. Limpar tentativas falhadas
    await this.bruteForceService.clearAttempts(ip);

    return {
      success: true,
      link: codeRecord.link,
    };
  }
}
