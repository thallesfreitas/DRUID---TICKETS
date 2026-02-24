/**
 * Public Routes - Endpoints acessíveis publicamente
 */

import { Router } from 'express';
import { CodeService } from '../services/codeService.js';
import { SettingsService } from '../services/settingsService.js';
import { StatsService } from '../services/statsService.js';
import { BruteForceService } from '../services/bruteForceService.js';
import { RedeemService } from '../services/redeemService.js';
import { RedeemSchema } from '../validators/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../types/index.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/api.js';
import { ERROR_MESSAGES } from '../constants/messages.js';
import { verifyRecaptcha } from '../services/recaptchaService.js';

export function createPublicRoutes(
  codeService: CodeService,
  settingsService: SettingsService,
  statsService: StatsService,
  bruteForceService: BruteForceService,
  redeemService: RedeemService
): Router {
  const router = Router();

  /**
   * GET /api/health - Health check
   */
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      db_connected: true,
    });
  });

  /**
   * GET /api/settings - Obter configurações
   */
  router.get(
    '/settings',
    asyncHandler(async (req, res) => {
      const settings = await settingsService.getAll();
      res.json(settings);
    })
  );

  /**
   * POST /api/redeem - Resgatar código
   */
  router.post(
    '/redeem',
    asyncHandler(async (req, res) => {
      const { code, captchaToken } = RedeemSchema.parse(req.body);
      const ip = extractIp(req);

      const captchaOk = await verifyRecaptcha(captchaToken, ip);
      if (!captchaOk) {
        throw new AppError(
          ERROR_MESSAGES.CAPTCHA_REQUIRED,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.CAPTCHA_REQUIRED
        );
      }

      const result = await redeemService.redeem(code, ip);
      res.json(result);
    })
  );

  /**
   * GET /api/stats - Estatísticas públicas
   */
  router.get(
    '/stats',
    asyncHandler(async (req, res) => {
      const stats = await statsService.getStats();
      res.json(stats);
    })
  );

  return router;
}

/**
 * Extrai IP do cliente
 */
function extractIp(req: any): string {
  return (req.ip ||
    (req.headers['x-forwarded-for'] as string) ||
    'unknown')
    .toString()
    .split(',')[0]
    .trim();
}
