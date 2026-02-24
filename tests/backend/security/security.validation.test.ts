/**
 * Validação de segurança (TECHNICAL_SCOPE § 10.3)
 * Agrupa cenários de: captcha obrigatório, bloqueio por IP, validação de entrada, auth admin.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { Duplex } from 'stream';
import { createPublicRoutes } from '@/api/routes/public';
import { createAdminRoutes } from '@/api/routes/admin';
import { errorHandler } from '@/api/middleware/errorHandler';
import { CodeService } from '@/api/services/codeService';
import { SettingsService } from '@/api/services/settingsService';
import { StatsService } from '@/api/services/statsService';
import { BruteForceService } from '@/api/services/bruteForceService';
import { RedeemService } from '@/api/services/redeemService';
import { ImportService } from '@/api/services/importService';
import { AdminAuthService } from '@/api/services/adminAuthService';
import { EmailService } from '@/api/services/emailService';
import { mockSettings, mockStats } from '@/tests/fixtures';
import { createTestIP } from '@/tests/utils';

vi.mock('@/api/services/recaptchaService', () => ({
  verifyRecaptcha: vi.fn(),
}));

import { verifyRecaptcha } from '@/api/services/recaptchaService';

type InvokeResponse = {
  status: number;
  body: any;
  headers: Record<string, string | string[] | number | undefined>;
};

async function invokeApp(
  app: express.Express,
  {
    method,
    url,
    headers = {},
    body,
  }: {
    method: 'GET' | 'POST';
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
): Promise<InvokeResponse> {
  return await new Promise((resolve, reject) => {
    const socket = new Duplex({
      read() {},
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    const req = new IncomingMessage(socket);
    req.method = method;
    req.url = url;
    req.headers = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );

    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];

    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    res.write = ((chunk: any, encoding?: any, cb?: any) => {
      if (chunk) {
        chunks.push(
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined)
        );
      }
      return origWrite(chunk, encoding, cb);
    }) as any;

    res.end = ((chunk?: any, encoding?: any, cb?: any) => {
      if (chunk) {
        chunks.push(
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined)
        );
      }

      origEnd(chunk, encoding, cb);

      const rawBody = Buffer.concat(chunks).toString('utf8');
      const contentType = String(res.getHeader('content-type') || '');
      let parsedBody: unknown = rawBody;

      if (contentType.includes('application/json') && rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = rawBody;
        }
      }

      resolve({
        status: res.statusCode,
        body: parsedBody,
        headers: res.getHeaders(),
      });

      return res;
    }) as any;

    res.assignSocket(socket as any);

    if (body !== undefined) {
      const payload = Buffer.from(JSON.stringify(body));
      req.headers['content-type'] = 'application/json';
      req.headers['content-length'] = String(payload.length);
      req.push(payload);
    }
    req.push(null);

    app.handle(req, res, (err: unknown) => {
      if (err) reject(err);
    });
  });
}

function createApp() {
  const app = express();
  app.use(express.json());

  const codeService = {
    getByCode: vi.fn(),
    markAsUsed: vi.fn(),
    getAll: vi.fn(),
    insertBatch: vi.fn(),
    getStats: vi.fn(),
    getRecentRedeems: vi.fn(),
    getRedeemedForExport: vi.fn(),
  } as unknown as CodeService;

  const settingsService = {
    getAll: vi.fn().mockResolvedValue(mockSettings.active),
    get: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    isStarted: vi.fn().mockResolvedValue(true),
    isEnded: vi.fn().mockResolvedValue(false),
  } as unknown as SettingsService;

  const statsService = {
    getStats: vi.fn().mockResolvedValue(mockStats.active),
  } as unknown as StatsService;

  const bruteForceService = {
    isBlocked: vi.fn().mockResolvedValue({ blocked: false }),
    recordFailedAttempt: vi.fn().mockResolvedValue({ blocked: false }),
    clearAttempts: vi.fn(),
    getAttempts: vi.fn(),
  } as unknown as BruteForceService;

  const redeemService = new RedeemService(
    codeService as CodeService,
    settingsService as SettingsService,
    bruteForceService as BruteForceService
  );

  const importService = {
    createJob: vi.fn(),
    getJobStatus: vi.fn(),
    updateProgress: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
    processChunks: vi.fn(),
    getProgress: vi.fn(),
  } as unknown as ImportService;

  const adminAuthService = {
    findByEmail: vi.fn(),
    createLoginCode: vi.fn(),
    findValidCode: vi.fn(),
    deleteCode: vi.fn(),
    cleanupExpiredCodes: vi.fn(),
  } as unknown as AdminAuthService;

  const emailService = {
    sendLoginCode: vi.fn(),
  } as unknown as EmailService;

  app.use(
    '/api',
    createPublicRoutes(
      codeService as CodeService,
      settingsService as SettingsService,
      statsService as StatsService,
      bruteForceService as BruteForceService,
      redeemService
    )
  );
  app.use(
    '/api/admin',
    createAdminRoutes(
      codeService as CodeService,
      settingsService as SettingsService,
      statsService as StatsService,
      importService as ImportService,
      adminAuthService as AdminAuthService,
      emailService as EmailService
    )
  );
  app.use(errorHandler);

  return {
    app,
    bruteForceService,
  };
}

describe('Validação de segurança', () => {
  beforeEach(() => {
    vi.mocked(verifyRecaptcha).mockResolvedValue(true);
  });

  describe('POST /api/redeem', () => {
    it('retorna 400 quando captcha é inválido (verifyRecaptcha retorna false)', async () => {
      vi.mocked(verifyRecaptcha).mockResolvedValue(false);
      const { app } = createApp();

      const res = await invokeApp(app, {
        method: 'POST',
        url: '/api/redeem',
        headers: { 'x-forwarded-for': createTestIP(1) },
        body: { code: 'PROMO123', captchaToken: 'token-invalido' },
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'captcha');
    });

    it('retorna 400 quando body não tem captchaToken (validação Zod)', async () => {
      const { app } = createApp();

      const res = await invokeApp(app, {
        method: 'POST',
        url: '/api/redeem',
        headers: { 'x-forwarded-for': createTestIP(1) },
        body: { code: 'PROMO123' },
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('retorna 400 quando body não tem code (validação Zod)', async () => {
      const { app } = createApp();

      const res = await invokeApp(app, {
        method: 'POST',
        url: '/api/redeem',
        headers: { 'x-forwarded-for': createTestIP(1) },
        body: { captchaToken: 'token' },
      });

      expect(res.status).toBe(400);
    });

    it('retorna 429 quando IP está bloqueado (brute force)', async () => {
      vi.mocked(verifyRecaptcha).mockResolvedValue(true);
      const { app, bruteForceService } = createApp();
      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({
        blocked: true,
        minutesRemaining: 15,
      });

      const res = await invokeApp(app, {
        method: 'POST',
        url: '/api/redeem',
        headers: { 'x-forwarded-for': createTestIP(1) },
        body: { code: 'PROMO123', captchaToken: 'valid-token' },
      });

      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('error', 'blocked');
    });
  });

  describe('Rotas admin', () => {
    it('GET /api/admin/codes retorna 401 sem Authorization', async () => {
      const { app } = createApp();

      const res = await invokeApp(app, {
        method: 'GET',
        url: '/api/admin/codes',
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'unauthorized');
    });

    it('GET /api/admin/export-redeemed retorna 401 sem Authorization', async () => {
      const { app } = createApp();

      const res = await invokeApp(app, {
        method: 'GET',
        url: '/api/admin/export-redeemed',
      });

      expect(res.status).toBe(401);
    });

    it('POST /api/admin/settings retorna 401 sem Authorization', async () => {
      const { app } = createApp();

      const res = await invokeApp(app, {
        method: 'POST',
        url: '/api/admin/settings',
        body: { start_date: '', end_date: '' },
      });

      expect(res.status).toBe(401);
    });
  });
});
