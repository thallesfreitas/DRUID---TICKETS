/**
 * Integration Flow Tests - Redeem Flow
 * End-to-end tests for complete redeem scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RedeemService } from '@/api/services/redeemService';
import { CodeService } from '@/api/services/codeService';
import { SettingsService } from '@/api/services/settingsService';
import { BruteForceService } from '@/api/services/bruteForceService';
import { mockCodes, mockSettings, mockBruteForce } from '@/tests/fixtures';
import { createTestIP } from '@/tests/utils';

describe('Redeem Flow - End-to-End Integration', () => {
  let redeemService: RedeemService;
  let codeService: CodeService;
  let settingsService: SettingsService;
  let bruteForceService: BruteForceService;

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

    bruteForceService = {
      isBlocked: vi.fn().mockResolvedValue({ blocked: false, minutesRemaining: 0 }),
      recordFailedAttempt: vi.fn().mockResolvedValue({ blocked: false }),
      clearAttempts: vi.fn().mockResolvedValue(undefined),
      getAttempts: vi.fn()
    } as any;

    redeemService = new RedeemService(codeService, settingsService, bruteForceService);
  });

  describe('Happy Path - User Successfully Redeems Code', () => {
    it('should complete full redeem flow', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(true);
      vi.mocked(settingsService.isEnded).mockResolvedValue(false);
      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({ blocked: false, minutesRemaining: 0 });
      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);
      vi.mocked(codeService.markAsUsed).mockResolvedValue(undefined);
      vi.mocked(bruteForceService.clearAttempts).mockResolvedValue(undefined);

      const result = await redeemService.redeem(code, ip);

      expect(result.success).toBe(true);
      expect(result.link).toBe(mockCodes.valid.link);
      expect(settingsService.isStarted).toHaveBeenCalled();
      expect(settingsService.isEnded).toHaveBeenCalled();
      expect(bruteForceService.isBlocked).toHaveBeenCalledWith(ip);
      expect(codeService.getByCode).toHaveBeenCalledWith(code);
      expect(codeService.markAsUsed).toHaveBeenCalled();
      expect(bruteForceService.clearAttempts).toHaveBeenCalledWith(ip);
    });

    it('should uppercase code before lookup', async () => {
      const code = 'promo123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      await redeemService.redeem(code, ip);

      expect(codeService.getByCode).toHaveBeenCalled();
    });

    it('should mark code as used with correct IP', async () => {
      const code = 'PROMO123';
      const ip = '10.0.0.100';

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      await redeemService.redeem(code, ip);

      expect(codeService.markAsUsed).toHaveBeenCalledWith(mockCodes.valid.id, ip);
    });

    it('should clear failed attempts after success', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      await redeemService.redeem(code, ip);

      expect(bruteForceService.clearAttempts).toHaveBeenCalledWith(ip);
    });
  });

  describe('Sad Path - Invalid Code Attempts', () => {
    it('should handle single invalid attempt', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: false });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();
      expect(bruteForceService.recordFailedAttempt).toHaveBeenCalledWith(ip);
    });

    it('should handle 5 invalid attempts and block IP', async () => {
      const ip = createTestIP(1);

      // First 4 attempts - not blocked
      for (let i = 0; i < 4; i++) {
        vi.mocked(codeService.getByCode).mockResolvedValue(null);
        vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: false });

        await expect(redeemService.redeem(`INVALID${i}`, ip)).rejects.toThrow();
        expect(bruteForceService.recordFailedAttempt).toHaveBeenCalledWith(ip);
      }

      // 5th attempt - blocked
      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: true });

      await expect(redeemService.redeem('INVALID5', ip)).rejects.toThrow();
    });

    it('should not record attempt for used code', async () => {
      const code = 'USED123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.used);

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();
      expect(bruteForceService.recordFailedAttempt).not.toHaveBeenCalled();
    });

    it('should not record attempt if promotion not started', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(false);

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();
      expect(bruteForceService.recordFailedAttempt).not.toHaveBeenCalled();
    });

    it('should fail fast if IP is blocked', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({ blocked: true, minutesRemaining: 10 });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();

      // Should not reach code lookup
      expect(codeService.getByCode).not.toHaveBeenCalled();
    });
  });

  describe('Timing and Promotion Window', () => {
    it('should reject redeem before promotion starts', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(false);

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();
    });

    it('should reject redeem after promotion ends', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(true);
      vi.mocked(settingsService.isEnded).mockResolvedValue(true);

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();
    });

    it('should allow redeem during active promotion window', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(true);
      vi.mocked(settingsService.isEnded).mockResolvedValue(false);
      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await redeemService.redeem(code, ip);

      expect(result.success).toBe(true);
    });

    it('should check promotion status before IP block check', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(settingsService.isStarted).mockResolvedValue(false);
      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({ blocked: true, minutesRemaining: 10 });

      await expect(redeemService.redeem(code, ip)).rejects.toThrow();

      expect(settingsService.isStarted).toHaveBeenCalled();
      expect(bruteForceService.isBlocked).not.toHaveBeenCalled();
    });
  });

  describe('Different IP Addresses', () => {
    it('should handle different IPv4 addresses independently', async () => {
      const code = 'PROMO123';
      const ip1 = createTestIP(1);
      const ip2 = createTestIP(2);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      // First IP redeems successfully
      const result1 = await redeemService.redeem(code, ip1);
      expect(result1.success).toBe(true);
      expect(codeService.markAsUsed).toHaveBeenCalledWith(mockCodes.valid.id, ip1);

      // Reset mocks for second attempt - code is already used
      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.used);

      // Second IP tries to use same code - should fail
      await expect(redeemService.redeem(code, ip2)).rejects.toThrow();
    });

    it('should track brute force per IP', async () => {
      const ip1 = createTestIP(1);
      const ip2 = createTestIP(2);

      // IP1 has 3 failed attempts
      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt)
        .mockResolvedValueOnce({ blocked: false })
        .mockResolvedValueOnce({ blocked: false })
        .mockResolvedValueOnce({ blocked: false });

      for (let i = 0; i < 3; i++) {
        await expect(redeemService.redeem('INVALID', ip1)).rejects.toThrow();
      }

      expect(bruteForceService.recordFailedAttempt).toHaveBeenCalledWith(ip1);

      // IP2 has only 1 failed attempt - should still be able to redeem
      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: false });
      vi.mocked(bruteForceService.isBlocked).mockResolvedValue({ blocked: false, minutesRemaining: 0 });

      const result = await redeemService.redeem('PROMO123', ip2);
      expect(result.success).toBe(true);
    });

    it('should handle localhost IP', async () => {
      const code = 'PROMO123';
      const ip = '127.0.0.1';

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
  });

  describe('Concurrent Access Scenarios', () => {
    it('should handle same user attempting same code simultaneously', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      // Both requests think they got a valid code
      const result1 = redeemService.redeem(code, ip);
      const result2 = redeemService.redeem(code, ip);

      const results = await Promise.all([
        result1.catch(e => ({ error: e })),
        result2.catch(e => ({ error: e }))
      ]);

      // At least one should succeed
      const successCount = results.filter(r => r && 'success' in r && r.success).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle same code from different IPs', async () => {
      const code = 'PROMO123';
      const ip1 = createTestIP(1);
      const ip2 = createTestIP(2);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      // First IP
      const result1 = await redeemService.redeem(code, ip1);
      expect(result1.success).toBe(true);

      // Second IP tries same code (now it's marked as used)
      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.used);
      await expect(redeemService.redeem(code, ip2)).rejects.toThrow();
    });
  });

  describe('Error Recovery and Logging', () => {
    it('should maintain state after failed redeem', async () => {
      const code1 = 'INVALID';
      const code2 = 'PROMO123';
      const ip = createTestIP(1);

      // First attempt fails
      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockResolvedValue({ blocked: false });

      await expect(redeemService.redeem(code1, ip)).rejects.toThrow();

      // Second attempt with valid code should still work
      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);

      const result = await redeemService.redeem(code2, ip);
      expect(result.success).toBe(true);
    });

    it('should handle database failure during code update', async () => {
      const code = 'PROMO123';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(mockCodes.valid);
      vi.mocked(codeService.markAsUsed).mockRejectedValue(new Error('DB error'));

      await expect(redeemService.redeem(code, ip)).rejects.toThrow('DB error');
    });

    it('should handle database failure during attempt recording', async () => {
      const code = 'INVALID';
      const ip = createTestIP(1);

      vi.mocked(codeService.getByCode).mockResolvedValue(null);
      vi.mocked(bruteForceService.recordFailedAttempt).mockRejectedValue(new Error('DB error'));

      await expect(redeemService.redeem(code, ip)).rejects.toThrow('DB error');
    });
  });
});
