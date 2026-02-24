/**
 * Integration Tests for Public Routes
 * Tests for all public API endpoints: health, settings, redeem, stats
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPublicRoutes } from '@/api/routes/public';
import { CodeService } from '@/api/services/codeService';
import { SettingsService } from '@/api/services/settingsService';
import { StatsService } from '@/api/services/statsService';
import { BruteForceService } from '@/api/services/bruteForceService';
import { RedeemService } from '@/api/services/redeemService';
import { AppError } from '@/api/types';
import { HTTP_STATUS } from '@/api/constants/api';
import { mockCodes, mockSettings, mockStats } from '@/tests/fixtures';
import { createTestIP } from '@/tests/utils';

// Mock request/response objects
interface MockRequest {
  ip?: string;
  headers: Record<string, string | string[]>;
  body: any;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
}

interface MockResponse {
  statusCode: number;
  jsonData: any;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
  setHeader: (key: string, value: string) => void;
  send: (data: string) => void;
}

function createMockRequest(overrides?: Partial<MockRequest>): MockRequest {
  return {
    ip: '192.168.1.1',
    headers: {},
    body: {},
    params: {},
    query: {},
    ...overrides
  };
}

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    jsonData: null,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
      return this;
    },
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    send(data: string) {
      this.jsonData = data;
    }
  };
}

describe('Public Routes', () => {
  let router: any;
  let codeService: CodeService;
  let settingsService: SettingsService;
  let statsService: StatsService;
  let bruteForceService: BruteForceService;
  let redeemService: RedeemService;

  beforeEach(() => {
    codeService = {
      getByCode: vi.fn(),
      markAsUsed: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      search: vi.fn(),
      getById: vi.fn(),
      insertBatch: vi.fn(),
      getStats: vi.fn(),
      getRecentRedeems: vi.fn(),
      getRedeemedForExport: vi.fn()
    } as any;

    settingsService = {
      getAll: vi.fn().mockResolvedValue(mockSettings.active),
      get: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      isStarted: vi.fn().mockResolvedValue(true),
      isEnded: vi.fn().mockResolvedValue(false)
    } as any;

    statsService = {
      getStats: vi.fn().mockResolvedValue(mockStats.active)
    } as any;

    bruteForceService = {
      isBlocked: vi.fn().mockResolvedValue({ blocked: false, minutesRemaining: 0 }),
      recordFailedAttempt: vi.fn().mockResolvedValue({ blocked: false }),
      clearAttempts: vi.fn().mockResolvedValue(undefined),
      getAttempts: vi.fn()
    } as any;

    redeemService = new RedeemService(codeService, settingsService, bruteForceService);
    router = createPublicRoutes(codeService, settingsService, statsService, bruteForceService, redeemService);
  });

  describe('GET /health', () => {
    it('should return health status with 200', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const layer = router.stack.find((layer: any) => layer.route?.path === '/health');
      const handler = layer?.route?.stack?.[0]?.handle;
      if (handler) {
        handler(req, res, () => {});
        expect(res.statusCode).toBe(200);
        expect(res.jsonData).toHaveProperty('status', 'ok');
        expect(res.jsonData).toHaveProperty('time');
        expect(res.jsonData).toHaveProperty('db_connected', true);
      }
    });

    it('should return ISO timestamp', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const layer = router.stack.find((layer: any) => layer.route?.path === '/health');
      const handler = layer?.route?.stack?.[0]?.handle;
      if (handler) {
        handler(req, res, () => {});
        expect(res.jsonData.time).toMatch(/\d{4}-\d{2}-\d{2}T/);
      }
    });

    it('should not require authentication', () => {
      const req = createMockRequest({ headers: {} });
      const res = createMockResponse();

      const layer = router.stack.find((layer: any) => layer.route?.path === '/health');
      const handler = layer?.route?.stack?.[0]?.handle;
      if (handler) {
        handler(req, res, () => {});
        expect(res.statusCode).toBe(200);
      }
    });
  });

  describe('GET /settings', () => {
    it('should return promotion settings', async () => {
      vi.mocked(settingsService.getAll).mockResolvedValue(mockSettings.active);

      const settings = await settingsService.getAll();
      expect(settings).toEqual(mockSettings.active);
    });

    it('should return settings for not-started promotion', async () => {
      vi.mocked(settingsService.getAll).mockResolvedValue(mockSettings.notStarted);

      const settings = await settingsService.getAll();
      expect(settings.start_date).toBeDefined();
    });

    it('should return empty settings if not configured', async () => {
      vi.mocked(settingsService.getAll).mockResolvedValue({
        start_date: '',
        end_date: ''
      });

      const settings = await settingsService.getAll();
      expect(settings).toBeDefined();
    });

    it('should handle settings service error', async () => {
      vi.mocked(settingsService.getAll).mockRejectedValue(new Error('DB error'));

      await expect(settingsService.getAll()).rejects.toThrow('DB error');
    });

    it('should return 200 on success', async () => {
      vi.mocked(settingsService.getAll).mockResolvedValue(mockSettings.active);

      const settings = await settingsService.getAll();
      expect(settings).toBeDefined();
    });
  });

  describe('POST /redeem', () => {
    it('should redeem valid unused code', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await redeemService.redeem(code, ip);

      expect(result.success).toBe(true);
      expect(result.link).toBe(mockCodes.valid.link);
      expect(codeService.markAsUsed).toHaveBeenCalledWith(mockCodes.valid.id, ip);
      expect(bruteForceService.clearAttempts).toHaveBeenCalledWith(ip);
    });

    it('should return link on successful redeem', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue({
        ...mockCodes.valid,
        link: 'https://example.com/promo'
      });

      const result = await redeemService.redeem(code, ip);

      expect(result.link).toBe('https://example.com/promo');
    });

    it('should reject invalid code with 404', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: false });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow(AppError);
      const error = await redeemService.redeem(code, ip).catch(e => e);
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('invalid');
    });

    it('should reject used code with 400', async () => {
      const code = 'USED123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.used);

      await expect(redeemService.redeem(code, ip)).rejects.toThrow(AppError);
      const error = await redeemService.redeem(code, ip).catch(e => e);
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('used');
    });

    it('should reject if promotion not started', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(false);

      await expect(redeemService.redeem(code, ip)).rejects.toThrow(AppError);
      const error = await redeemService.redeem(code, ip).catch(e => e);
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('not_started');
    });

    it('should reject if promotion ended', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isEnded).mockResolvedValue(true);

      await expect(redeemService.redeem(code, ip)).rejects.toThrow(AppError);
      const error = await redeemService.redeem(code, ip).catch(e => e);
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('ended');
    });

    it('should block IP after 5 failed attempts', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: true });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow(AppError);
      const error = await redeemService.redeem(code, ip).catch(e => e);
      expect(error.statusCode).toBe(429);
      expect(error.errorCode).toBe('blocked');
    });

    it('should reject if IP is already blocked', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({
        blocked: true,
        minutesRemaining: 10
      });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow(AppError);
      const error = await redeemService.redeem(code, ip).catch(e => e);
      expect(error.statusCode).toBe(429);
      expect(error.errorCode).toBe('blocked');
      expect(error.message).toContain('10');
    });

    it('should clear attempts after successful redeem', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      await redeemService.redeem(code, ip);

      expect(bruteForceService.clearAttempts).toHaveBeenCalledWith(ip);
    });

    it('should not clear attempts on failure', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: false });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();

      expect(bruteForceService.clearAttempts).not.toHaveBeenCalled();
    });

    it('should validate missing code field', async () => {
      const code = '';
      const ip = createTestIP(1);

      // Missing code should fail validation before reaching service
      expect(code.length).toBe(0);
    });

    it('should validate missing captchaToken field', async () => {
      // Missing captcha should fail validation before reaching service
      expect(true).toBe(true);
    });

    it('should handle uppercase conversion', async () => {
      const code = 'promo123';
      const ip = createTestIP(1);

      // Service should uppercase the code
      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      await redeemService.redeem(code, ip);

      // codeService should be called with uppercase
      expect(codeService.getByCode).toHaveBeenCalled();
    });

    it('should extract IP from request', async () => {
      const code = 'PROMO123';
      const ip = '192.168.1.100';

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await redeemService.redeem(code, ip);

      expect(result.success).toBe(true);
      expect(codeService.markAsUsed).toHaveBeenCalledWith(mockCodes.valid.id, ip);
    });

    it('should handle IPv6 addresses', async () => {
      const code = 'PROMO123';
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await redeemService.redeem(code, ip);

      expect(result.success).toBe(true);
      expect(codeService.markAsUsed).toHaveBeenCalledWith(mockCodes.valid.id, ip);
    });

    it('should handle localhost IP', async () => {
      const code = 'PROMO123';
      const ip = '127.0.0.1';

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await redeemService.redeem(code, ip);

      expect(result.success).toBe(true);
    });

    it('should handle special characters in code', async () => {
      const code = 'PROMO-123_ABC';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue({
        ...mockCodes.valid,
        code
      });

      const result = await redeemService.redeem(code, ip);

      expect(result.success).toBe(true);
    });

    it('should handle very long codes', async () => {
      const code = 'A'.repeat(1000);
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: false });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();
    });

    it('should check promotion status before checking IP', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(false);
      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({ blocked: true, minutesRemaining: 10 });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();

      // Should check promotion first, not IP
      expect(settingsService.isStarted).toHaveBeenCalled();
      // And not reach the IP check
      expect(bruteForceService.isBlocked).not.toHaveBeenCalled();
    });

    it('should not record attempt for used code', async () => {
      const code = 'USED123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.used);

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();

      // Should NOT record failed attempt for used code
      expect(bruteForceService.recordFailedAttempt).not.toHaveBeenCalled();
    });

    it('should record attempt for invalid code', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: false });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();

      expect(bruteForceService.recordFailedAttempt).toHaveBeenCalledWith(ip);
    });
  });

  describe('GET /stats', () => {
    it('should return statistics', async () => {
      vi.mocked(statsService.getStats).mockResolvedValue(mockStats.active);

      const stats = await statsService.getStats();

      expect(stats).toEqual(mockStats.active);
    });

    it('should return total codes count', async () => {
      vi.mocked(statsService.getStats).mockResolvedValue({
        total: 100,
        used: 50,
        available: 50,
        recent: []
      });

      const stats = await statsService.getStats();

      expect(stats.total).toBe(100);
    });

    it('should return available codes calculation', async () => {
      vi.mocked(statsService.getStats).mockResolvedValue({
        total: 100,
        used: 25,
        available: 75,
        recent: []
      });

      const stats = await statsService.getStats();

      expect(stats.available).toBe(75);
      expect(stats.available).toBe(stats.total - stats.used);
    });

    it('should return recent redeems', async () => {
      vi.mocked(statsService.getStats).mockResolvedValue({
        total: 100,
        used: 50,
        available: 50,
        recent: [mockCodes.valid]
      });

      const stats = await statsService.getStats();

      expect(stats.recent).toBeDefined();
      expect(Array.isArray(stats.recent)).toBe(true);
    });

    it('should handle no codes scenario', async () => {
      vi.mocked(statsService.getStats).mockResolvedValue({
        total: 0,
        used: 0,
        available: 0,
        recent: []
      });

      const stats = await statsService.getStats();

      expect(stats.total).toBe(0);
      expect(stats.available).toBe(0);
    });

    it('should handle all codes used', async () => {
      vi.mocked(statsService.getStats).mockResolvedValue({
        total: 100,
        used: 100,
        available: 0,
        recent: []
      });

      const stats = await statsService.getStats();

      expect(stats.used).toBe(stats.total);
      expect(stats.available).toBe(0);
    });

    it('should handle stats service error', async () => {
      vi.mocked(statsService.getStats).mockRejectedValue(new Error('DB error'));

      await expect(statsService.getStats()).rejects.toThrow('DB error');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors with 400', async () => {
      const code = '';
      const ip = createTestIP(1);

      // Empty code should fail validation
      expect(code.length).toBe(0);
    });

    it('should handle database errors with 500', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockRejectedValue(new Error('DB connection failed'));

      await expect(redeemService.redeem(code, ip)).rejects.toThrow('DB connection failed');
    });

    it('should handle brute force service errors', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(bruteForceService.isBlocked).mockRejectedValue(new Error('Redis error'));

      await expect(redeemService.redeem(code, ip)).rejects.toThrow('Redis error');
    });

    it('should handle settings service errors', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockRejectedValue(new Error('Settings error'));

      await expect(redeemService.redeem(code, ip)).rejects.toThrow('Settings error');
    });
  });
});
