/**
 * Public Routes - Endpoints acessíveis publicamente
 */

import { Router } from 'express';
import { CodeService } from '../services/codeService.js';
import { SettingsService } from '../services/settingsService.js';
import { StatsService } from '../services/statsService.js';
import { BruteForceService } from '../services/bruteForceService.js';
import { RedeemService } from '../services/redeemService.js';
import { RedeemSchema, RequestVerificationSchema, RedeemInfluencerSchema } from '../validators/index.js';
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
   * POST /api/request-verification - Solicita OTP por e-mail
   */
  router.post(
    '/request-verification',
    asyncHandler(async (req, res) => {
      const { promoCode, email, captchaToken } = RequestVerificationSchema.parse(req.body);
      const ip = extractIp(req);

      const captchaOk = await verifyRecaptcha(captchaToken, ip);
      if (!captchaOk) {
        throw new AppError(
          ERROR_MESSAGES.CAPTCHA_REQUIRED,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.CAPTCHA_REQUIRED
        );
      }

      const result = await redeemService.requestVerification(promoCode, email);
      res.json(result);
    })
  );

  /**
   * POST /api/redeem-influencer - Valida OTP e entrega prêmio aleatório
   */
  router.post(
    '/redeem-influencer',
    asyncHandler(async (req, res) => {
      const { email, verificationCode } = RedeemInfluencerSchema.parse(req.body);
      const ip = extractIp(req);

      const result = await redeemService.redeemInfluencer(email, verificationCode, ip);
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
 * Extrai IP do cliente (considera proxy e x-forwarded-for).
 * Prefere IPv4 quando houver (inclui IPv4-mapped IPv6 como ::ffff:x.y.z.w).
 * Se o cliente for só IPv6, retorna o IPv6.
 */
function extractIp(req: import('express').Request): string {
  const raw =
    req.ip ||
    (req.headers['x-forwarded-for'] as string | undefined) ||
    (req.headers['x-real-ip'] as string | undefined) ||
    'unknown';
  const candidates = String(raw).split(',').map((s) => s.trim());
  for (const candidate of candidates) {
    const ipv4 = toIPv4IfPossible(candidate);
    if (ipv4) return ipv4;
  }
  return candidates[0] || 'unknown';
}

const IPv4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const IPv4_MAPPED_REGEX = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;

function toIPv4IfPossible(ip: string): string | null {
  if (IPv4_REGEX.test(ip)) return ip;
  const mapped = ip.match(IPv4_MAPPED_REGEX);
  if (mapped) return mapped[1];
  return null;
}
