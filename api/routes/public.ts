/**
 * Public Routes - Endpoints acessíveis publicamente
 */

import { Router } from 'express';
import { CodeService } from '../services/codeService';
import { SettingsService } from '../services/settingsService';
import { StatsService } from '../services/statsService';
import { BruteForceService } from '../services/bruteForceService';
import { RedeemService } from '../services/redeemService';
import { RedeemSchema } from '../validators';
import { asyncHandler, errorHandler } from '../middleware/errorHandler';
import { AppError } from '../types';
import { HTTP_STATUS } from '../constants/api';
import { ENDPOINT_PATHS } from '../constants/api';

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
