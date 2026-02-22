/**
 * Tests for BruteForceService
 * Brute force attack protection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BruteForceService } from '@/api/services/bruteForceService';
import { mockBruteForce } from '@/tests/fixtures/bruteForce';
import { createMockDatabaseClient } from '@/tests/mocks/db';
import { createTestIP } from '@/tests/utils';

describe('BruteForceService', () => {
  let service: BruteForceService;
  let db: any;

  beforeEach(() => {
    db = createMockDatabaseClient();
    service = new BruteForceService(db);
  });

  describe('getAttempts', () => {
    it('should return brute force record by IP', async () => {
      const mockRecord = mockBruteForce.attempt3;
      db.execute.mockResolvedValue([mockRecord]);

      const result = await service.getAttempts('192.168.1.1');

      expect(result).toEqual(mockRecord);
      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['192.168.1.1']
        })
      );
    });

    it('should return null if IP not found', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.getAttempts('192.168.1.1');

      expect(result).toBeNull();
    });

    it('should work with different IP formats', async () => {
      const ips = ['192.168.1.1', '10.0.0.1', '127.0.0.1'];

      for (const ip of ips) {
        db.execute.mockResolvedValue([mockBruteForce.attempt0]);
        await service.getAttempts(ip);
      }

      expect(db.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle IPv6 addresses', async () => {
      const ipv6 = '2001:0db8:85a3::8a2e:0370:7334';
      db.execute.mockResolvedValue([mockBruteForce.attempt0]);

      const result = await service.getAttempts(ipv6);

      expect(result).toBeDefined();
    });
  });

  describe('isBlocked', () => {
    it('should return not blocked if no record', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.isBlocked('192.168.1.1');

      expect(result).toEqual({ blocked: false });
    });

    it('should return not blocked if no blocked_until', async () => {
      const record = mockBruteForce.attempt3; // No block
      db.execute.mockResolvedValue([record]);

      const result = await service.isBlocked('192.168.1.1');

      expect(result).toEqual({ blocked: false });
    });

    it('should return blocked with minutes remaining', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);
      const record = {
        ...mockBruteForce.attempt5Blocked,
        blocked_until: futureDate.toISOString()
      };
      db.execute.mockResolvedValue([record]);

      const result = await service.isBlocked('192.168.1.1');

      expect(result.blocked).toBe(true);
      expect(result.minutesRemaining).toBeGreaterThan(0);
      expect(result.minutesRemaining).toBeLessThanOrEqual(10);
    });

    it('should return not blocked if block expired', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 15);
      const record = {
        ...mockBruteForce.blockExpired,
        blocked_until: pastDate.toISOString()
      };
      db.execute.mockResolvedValue([record]);

      const result = await service.isBlocked('192.168.1.1');

      expect(result).toEqual({ blocked: false });
    });

    it('should calculate minutes remaining correctly', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5);
      const record = {
        ...mockBruteForce.attempt5Blocked,
        blocked_until: futureDate.toISOString()
      };
      db.execute.mockResolvedValue([record]);

      const result = await service.isBlocked('192.168.1.1');

      expect(result.minutesRemaining).toBeGreaterThanOrEqual(4);
      expect(result.minutesRemaining).toBeLessThanOrEqual(5);
    });

    it('should round up minutes remaining', async () => {
      const futureDate = new Date();
      futureDate.setSeconds(futureDate.getSeconds() + 30); // 30 seconds = 0.5 minutes
      const record = {
        ...mockBruteForce.attempt5Blocked,
        blocked_until: futureDate.toISOString()
      };
      db.execute.mockResolvedValue([record]);

      const result = await service.isBlocked('192.168.1.1');

      expect(result.minutesRemaining).toBe(1); // ceil(0.5) = 1
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment attempt count', async () => {
      const record = { ...mockBruteForce.attempt0, attempts: 2 };
      db.execute.mockResolvedValue([record]);

      await service.recordFailedAttempt('192.168.1.1');

      const callArgs = db.execute.mock.calls[1][0]; // Second call (after getAttempts)
      expect(callArgs.args[1]).toBe(3); // 2 + 1
    });

    it('should not block before max attempts', async () => {
      const record = { ...mockBruteForce.attempt3, attempts: 3 };
      db.execute.mockResolvedValue([record]);

      const result = await service.recordFailedAttempt('192.168.1.1');

      expect(result.blocked).toBe(false);
    });

    it('should block after max attempts (5)', async () => {
      const record = { ...mockBruteForce.attempt5Blocked, attempts: 4 };
      db.execute.mockResolvedValue([record]);

      const result = await service.recordFailedAttempt('192.168.1.1');

      expect(result.blocked).toBe(true);
      expect(result.minutesRemaining).toBe(15); // BRUTE_FORCE_BLOCK_DURATION_MIN
    });

    it('should set correct block duration', async () => {
      db.execute.mockResolvedValue([mockBruteForce.attempt0]);

      await service.recordFailedAttempt('192.168.1.1');

      const callArgs = db.execute.mock.calls[1][0];
      const blockedUntil = callArgs.args[3];

      if (blockedUntil) {
        const now = new Date();
        const blockDate = new Date(blockedUntil);
        const diffMinutes = (blockDate.getTime() - now.getTime()) / 60000;

        // Should be approximately 15 minutes
        expect(diffMinutes).toBeGreaterThanOrEqual(14);
        expect(diffMinutes).toBeLessThanOrEqual(15);
      }
    });

    it('should handle first attempt for new IP', async () => {
      db.execute.mockResolvedValue([null]); // No existing record

      const result = await service.recordFailedAttempt('192.168.1.1');

      expect(result.blocked).toBe(false);
      const callArgs = db.execute.mock.calls[1][0];
      expect(callArgs.args[1]).toBe(1); // First attempt
    });

    it('should record with current timestamp', async () => {
      db.execute.mockResolvedValue([mockBruteForce.attempt0]);
      const beforeTime = new Date();

      await service.recordFailedAttempt('192.168.1.1');

      const afterTime = new Date();
      const callArgs = db.execute.mock.calls[1][0];
      const recordedTime = new Date(callArgs.args[2]);

      expect(recordedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(recordedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should work with multiple IPs independently', async () => {
      db.execute
        .mockResolvedValueOnce([mockBruteForce.attempt0]) // IP1 attempts
        .mockResolvedValueOnce(undefined) // Update for IP1
        .mockResolvedValueOnce([mockBruteForce.attempt3]) // IP2 attempts
        .mockResolvedValueOnce(undefined); // Update for IP2

      const result1 = await service.recordFailedAttempt('192.168.1.1');
      const result2 = await service.recordFailedAttempt('192.168.1.2');

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('clearAttempts', () => {
    it('should delete brute force record', async () => {
      await service.clearAttempts('192.168.1.1');

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['192.168.1.1']
        })
      );
    });

    it('should work with different IPs', async () => {
      const ips = ['192.168.1.1', '10.0.0.1', '127.0.0.1'];

      for (const ip of ips) {
        await service.clearAttempts(ip);
      }

      expect(db.execute).toHaveBeenCalledTimes(3);
    });

    it('should silently succeed even if IP not found', async () => {
      await expect(service.clearAttempts('nonexistent-ip')).resolves.not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should block IP after 5 failures', async () => {
      const ip = createTestIP(1);

      // First 4 failures - not blocked
      for (let i = 0; i < 4; i++) {
        db.execute.mockResolvedValueOnce([{ ...mockBruteForce.attempt0, attempts: i }]);
        const result = await service.recordFailedAttempt(ip);
        expect(result.blocked).toBe(false);
      }

      // 5th failure - blocked
      db.execute.mockResolvedValueOnce([{ ...mockBruteForce.attempt0, attempts: 4 }]);
      const result = await service.recordFailedAttempt(ip);
      expect(result.blocked).toBe(true);
    });

    it('should clear attempts after successful redeem', async () => {
      const ip = createTestIP(1);

      // Record some failures
      db.execute.mockResolvedValue([mockBruteForce.attempt3]);
      await service.recordFailedAttempt(ip);

      // Clear after success
      await service.clearAttempts(ip);

      expect(db.execute).toHaveBeenCalled();
    });

    it('should check if blocked after clearing', async () => {
      const ip = createTestIP(1);

      // Clear attempts
      await service.clearAttempts(ip);

      // Check blocked status
      db.execute.mockResolvedValue([]);
      const result = await service.isBlocked(ip);

      expect(result.blocked).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.getAttempts('192.168.1.1')).rejects.toThrow('DB error');
    });

    it('should propagate errors in recordFailedAttempt', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.recordFailedAttempt('192.168.1.1')).rejects.toThrow('DB error');
    });

    it('should propagate errors in clearAttempts', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.clearAttempts('192.168.1.1')).rejects.toThrow('DB error');
    });
  });
});
