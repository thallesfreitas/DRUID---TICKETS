/**
 * Tests for RedeemService
 * Critical service for code redemption flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RedeemService } from '@/api/services/redeemService';
import { CodeService } from '@/api/services/codeService';
import { SettingsService } from '@/api/services/settingsService';
import { BruteForceService } from '@/api/services/bruteForceService';
import { AppError } from '@/api/types';
import { mockCodes } from '@/tests/fixtures/codes';
import { createTestIP } from '@/tests/utils';

describe('RedeemService', () => {
  let service: RedeemService;
  let codeService: CodeService;
  let settingsService: SettingsService;
  let bruteForceService: BruteForceService;

  beforeEach(() => {
    // Mock services
    codeService = {
      getByCode: vi.fn(),
      markAsUsed: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      search: vi.fn()
    } as any;

    settingsService = {
      getAll: vi.fn(),
      update: vi.fn(),
      isStarted: vi.fn().mockResolvedValue(true),
      isEnded: vi.fn().mockResolvedValue(false)
    } as any;

    bruteForceService = {
      isBlocked: vi.fn().mockResolvedValue({ blocked: false, minutesRemaining: 0 }),
      recordFailedAttempt: vi.fn().mockResolvedValue({ blocked: false }),
      clearAttempts: vi.fn().mockResolvedValue(undefined),
      getAttempts: vi.fn()
    } as any;

    service = new RedeemService(codeService, settingsService, bruteForceService);
  });

  describe('redeem - success cases', () => {
    it('should redeem valid unused code', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await service.redeem(code, ip);

      expect(result.success).toBe(true);
      expect(result.link).toBe(mockCodes.valid.link);
      expect(codeService.markAsUsed).toHaveBeenCalledWith(mockCodes.valid.id, ip);
      expect(bruteForceService.clearAttempts).toHaveBeenCalledWith(ip);
    });

    it('should reset failed attempts after successful redeem', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      await service.redeem(code, ip);

      expect(bruteForceService.clearAttempts).toHaveBeenCalledWith(ip);
    });

    it('should work with different valid codes', async () => {
      const ip = createTestIP(1);
      const codeVariants = ['ABC123', 'XYZ789', 'CODE999'];

      for (const code of codeVariants) {
        vi.mocked(codeService.getByCode).mockResolvedValueOnce({
          ...mockCodes.valid,
          code
        });

        const result = await service.redeem(code, ip);
        expect(result.success).toBe(true);
      }
    });

    it('should work with different IPs', async () => {
      const code = 'PROMO123';

      for (let i = 1; i <= 5; i++) {
        const ip = createTestIP(i);
        vi.mocked(codeService.getByCode).mockResolvedValueOnce(mockCodes.valid);

        const result = await service.redeem(code, ip);
        expect(result.success).toBe(true);
        expect(codeService.markAsUsed).toHaveBeenCalledWith(mockCodes.valid.id, ip);
      }

      expect(codeService.markAsUsed).toHaveBeenCalledTimes(5);
    });
  });

  describe('redeem - promotion validation', () => {
    it('should reject if promotion not started', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(false);

      await expect(service.redeem(code, ip)).rejects.toThrow(AppError);

      const error = await service.redeem(code, ip).catch(e => e as AppError);
      expect(error.statusCode).toBe(403); // FORBIDDEN
      expect(error.errorCode).toBe('not_started');
    });

    it('should reject if promotion ended', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isEnded).mockResolvedValue(true);

      await expect(service.redeem(code, ip)).rejects.toThrow(AppError);

      const error = await service.redeem(code, ip).catch(e => e as AppError);
      expect(error.statusCode).toBe(403); // FORBIDDEN
      expect(error.errorCode).toBe('ended');
    });

    it('should check promotion status before checking IP', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(false);
      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({ blocked: true, minutesRemaining: 10 });

      await expect(service.redeem(code, ip)).rejects.toThrow();

      // Should check promotion first, not IP
      expect(settingsService.isStarted).toHaveBeenCalled();
      // And not reach the IP check
      expect(bruteForceService.isBlocked).not.toHaveBeenCalled();
    });
  });

  describe('redeem - brute force protection', () => {
    it('should reject if IP is blocked', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);
      const minutesRemaining = 10;

      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({
        blocked: true,
        minutesRemaining
      });

      await expect(service.redeem(code, ip)).rejects.toThrow(AppError);

      const error = await service.redeem(code, ip).catch(e => e as AppError);
      expect(error.statusCode).toBe(429); // RATE_LIMIT
      expect(error.errorCode).toBe('blocked');
      expect(error.message).toContain(String(minutesRemaining));
    });

    it('should block IP after 5 failed attempts', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({
        blocked: true
      });

      await expect(service.redeem(code, ip)).rejects.toThrow(AppError);

      const error = await service.redeem(code, ip).catch(e => e as AppError);
      expect(error.statusCode).toBe(429); // RATE_LIMIT
      expect(error.errorCode).toBe('blocked');
    });

    it('should record failed attempt for invalid code', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({
        blocked: false
      });

      await expect(service.redeem(code, ip)).rejects.toThrow(AppError);

      expect(bruteForceService.recordFailedAttempt).toHaveBeenCalledWith(ip);
    });

    it('should NOT record failed attempt for used code', async () => {
      const code = mockCodes.used.code;
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.used);

      await expect(service.redeem(code, ip)).rejects.toThrow(AppError);

      // Should NOT record failed attempt for used code
      expect(bruteForceService.recordFailedAttempt).not.toHaveBeenCalled();
    });

    it('should NOT clear attempts if code is invalid', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({
        blocked: false
      });

      await expect(service.redeem(code, ip)).rejects.toThrow();

      expect(bruteForceService.clearAttempts).not.toHaveBeenCalled();
    });
  });

  describe('redeem - code validation', () => {
    it('should reject invalid code', async () => {
      const code = 'NONEXISTENT';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({
        blocked: false
      });

      await expect(service.redeem(code, ip)).rejects.toThrow(AppError);

      const error = await service.redeem(code, ip).catch(e => e as AppError);
      expect(error.statusCode).toBe(404); // NOT_FOUND
      expect(error.errorCode).toBe('invalid');
    });

    it('should reject already used code', async () => {
      const code = mockCodes.used.code;
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.used);

      await expect(service.redeem(code, ip)).rejects.toThrow(AppError);

      const error = await service.redeem(code, ip).catch(e => e as AppError);
      expect(error.statusCode).toBe(400); // BAD_REQUEST
      expect(error.errorCode).toBe('used');
    });

    it('should not mark code as used if it was already used', async () => {
      const code = mockCodes.used.code;
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.used);

      await expect(service.redeem(code, ip)).rejects.toThrow();

      expect(codeService.markAsUsed).not.toHaveBeenCalled();
    });

    it('should handle code lookup returning null', async () => {
      const code = 'ANYCODE';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({
        blocked: false
      });

      await expect(service.redeem(code, ip)).rejects.toThrow();

      expect(codeService.getByCode).toHaveBeenCalledWith(code);
    });
  });

  describe('redeem - error handling', () => {
    it('should handle service errors gracefully', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);
      const error = new Error('Database connection failed');

      vi.mocked(codeService.getByCode).mockRejectedValue(error);

      await expect(service.redeem(code, ip)).rejects.toThrow();
    });

    it('should handle brute force service errors', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);
      const error = new Error('Redis connection failed');

      vi.mocked(bruteForceService.isBlocked).mockRejectedValue(error);

      await expect(service.redeem(code, ip)).rejects.toThrow();
    });

    it('should handle settings service errors', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);
      const error = new Error('Settings not available');

      vi.mocked(settingsService.isStarted).mockRejectedValue(error);

      await expect(service.redeem(code, ip)).rejects.toThrow();
    });
  });

  describe('redeem - edge cases', () => {
    it('should handle code with special characters', async () => {
      const code = 'PROMO-123_ABC';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue({
        ...mockCodes.valid,
        code
      });

      const result = await service.redeem(code, ip);
      expect(result.success).toBe(true);
    });

    it('should handle very long code', async () => {
      const code = 'A'.repeat(1000);
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({
        blocked: false
      });

      await expect(service.redeem(code, ip)).rejects.toThrow();
      expect(codeService.getByCode).toHaveBeenCalledWith(code);
    });

    it('should handle IPv6 addresses', async () => {
      const code = 'PROMO123';
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await service.redeem(code, ip);
      expect(result.success).toBe(true);
      expect(codeService.markAsUsed).toHaveBeenCalledWith(mockCodes.valid.id, ip);
    });

    it('should work with localhost IP', async () => {
      const code = 'PROMO123';
      const ip = '127.0.0.1';

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await service.redeem(code, ip);
      expect(result.success).toBe(true);
    });
  });
});
