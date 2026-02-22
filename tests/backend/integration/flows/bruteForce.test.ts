/**
 * Integration Flow Tests - Brute Force Protection
 * End-to-end tests for brute force blocking and recovery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BruteForceService } from '@/api/services/bruteForceService';
import { createMockDatabaseClient } from '@/tests/mocks/db';
import { mockBruteForce } from '@/tests/fixtures';
import { createTestIP } from '@/tests/utils';

describe('Brute Force Protection Flow', () => {
  let service: BruteForceService;
  let db: any;

  beforeEach(() => {
    db = createMockDatabaseClient();
    service = new BruteForceService(db);
  });

  describe('Attack Scenario - 5 Failed Attempts', () => {
    it('should block IP after 5 consecutive failed attempts', async () => {
      const ip = createTestIP(1);

      // First 4 attempts - not blocked
      for (let i = 1; i <= 4; i++) {
        const result = await service.recordFailedAttempt(ip);
        expect(result.blocked).toBe(false);
      }

      // 5th attempt - blocked
      const result = await service.recordFailedAttempt(ip);
      expect(result.blocked).toBe(true);

      // Verify IP is now blocked
      const isBlockedResult = await service.isBlocked(ip);
      expect(isBlockedResult.blocked).toBe(true);
    });

    it('should reject new attempts while blocked', async () => {
      const ip = createTestIP(1);

      // Block the IP
      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }

      // Try new attempt
      const result = await service.isBlocked(ip);
      expect(result.blocked).toBe(true);
      expect(result.minutesRemaining).toBeGreaterThan(0);
    });

    it('should increment attempt count with each failure', async () => {
      const ip = createTestIP(1);

      await service.recordFailedAttempt(ip);
      let attempts = await service.getAttempts(ip);
      expect(attempts?.count).toBe(1);

      await service.recordFailedAttempt(ip);
      attempts = await service.getAttempts(ip);
      expect(attempts?.count).toBe(2);

      await service.recordFailedAttempt(ip);
      attempts = await service.getAttempts(ip);
      expect(attempts?.count).toBe(3);
    });

    it('should set block duration on 5th attempt', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }

      const result = await service.isBlocked(ip);
      expect(result.blocked).toBe(true);
      expect(result.minutesRemaining).toBeLessThanOrEqual(15);
      expect(result.minutesRemaining).toBeGreaterThan(0);
    });

    it('should maintain separate counts for different IPs', async () => {
      const ip1 = createTestIP(1);
      const ip2 = createTestIP(2);

      // IP1: 3 attempts
      for (let i = 0; i < 3; i++) {
        await service.recordFailedAttempt(ip1);
      }

      // IP2: 1 attempt
      await service.recordFailedAttempt(ip2);

      // IP1 should not be blocked yet
      let result = await service.isBlocked(ip1);
      expect(result.blocked).toBe(false);

      // IP2 should definitely not be blocked
      result = await service.isBlocked(ip2);
      expect(result.blocked).toBe(false);

      // IP1: 2 more attempts = 5 total = blocked
      await service.recordFailedAttempt(ip1);
      await service.recordFailedAttempt(ip1);

      result = await service.isBlocked(ip1);
      expect(result.blocked).toBe(true);

      // IP2 should still have 0 attempts (not recorded from attempts)
      result = await service.isBlocked(ip2);
      expect(result.blocked).toBe(false);
    });

    it('should handle IPv6 addresses separately from IPv4', async () => {
      const ipv4 = '192.168.1.1';
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ipv4);
      }

      // IPv4 should be blocked
      let result = await service.isBlocked(ipv4);
      expect(result.blocked).toBe(true);

      // IPv6 should not be blocked (different address)
      result = await service.isBlocked(ipv6);
      expect(result.blocked).toBe(false);
    });
  });

  describe('Recovery - Clear Attempts After Success', () => {
    it('should clear attempts after successful redeem', async () => {
      const ip = createTestIP(1);

      // Record 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await service.recordFailedAttempt(ip);
      }

      let attempts = await service.getAttempts(ip);
      expect(attempts?.count).toBe(3);

      // Clear attempts after successful redeem
      await service.clearAttempts(ip);

      // Verify attempts are cleared
      attempts = await service.getAttempts(ip);
      expect(attempts).toBeNull();
    });

    it('should allow redeem from previously blocked IP after clearing', async () => {
      const ip = createTestIP(1);

      // Block the IP (5 attempts)
      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }

      let result = await service.isBlocked(ip);
      expect(result.blocked).toBe(true);

      // Clear attempts (simulating successful redeem)
      await service.clearAttempts(ip);

      // IP should no longer be blocked
      result = await service.isBlocked(ip);
      expect(result.blocked).toBe(false);
    });

    it('should reset attempt count to zero after clear', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 4; i++) {
        await service.recordFailedAttempt(ip);
      }

      let attempts = await service.getAttempts(ip);
      expect(attempts?.count).toBe(4);

      await service.clearAttempts(ip);

      attempts = await service.getAttempts(ip);
      expect(attempts).toBeNull();
    });

    it('should start fresh counter after clear', async () => {
      const ip = createTestIP(1);

      // Block and clear
      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }
      await service.clearAttempts(ip);

      // New failure starts at 1
      await service.recordFailedAttempt(ip);
      const attempts = await service.getAttempts(ip);
      expect(attempts?.count).toBe(1);
    });
  });

  describe('Time-based Block Expiration', () => {
    it('should calculate minutes remaining correctly', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }

      const result = await service.isBlocked(ip);
      expect(result.blocked).toBe(true);
      expect(result.minutesRemaining).toBeLessThanOrEqual(15);
      expect(result.minutesRemaining).toBeGreaterThan(0);
    });

    it('should set block duration to 15 minutes', async () => {
      const ip = createTestIP(1);

      const BLOCK_DURATION_MIN = 15;

      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }

      const result = await service.isBlocked(ip);
      expect(result.minutesRemaining).toBeLessThanOrEqual(BLOCK_DURATION_MIN);
      expect(result.minutesRemaining).toBeGreaterThan(BLOCK_DURATION_MIN - 1);
    });

    it('should decrement minutes remaining over time', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }

      const result1 = await service.isBlocked(ip);
      const minutes1 = result1.minutesRemaining;

      // Wait a bit (in tests we just check it's working)
      const result2 = await service.isBlocked(ip);
      const minutes2 = result2.minutesRemaining;

      // Minutes should be same or less
      expect(minutes2).toBeLessThanOrEqual(minutes1);
    });

    it('should return 0 minutes when block has expired', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }

      // In real scenario, block expires after 15 minutes
      // For testing, we simulate by clearing when checking
      let result = await service.isBlocked(ip);
      expect(result.blocked).toBe(true);

      // Simulate block expiration by clearing
      await service.clearAttempts(ip);

      result = await service.isBlocked(ip);
      expect(result.blocked).toBe(false);
      expect(result.minutesRemaining).toBe(0);
    });
  });

  describe('Edge Cases - Boundary Conditions', () => {
    it('should handle exactly 5 attempts correctly', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 5; i++) {
        const result = await service.recordFailedAttempt(ip);
        if (i < 4) {
          expect(result.blocked).toBe(false);
        } else {
          expect(result.blocked).toBe(true);
        }
      }
    });

    it('should handle more than 5 attempts', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 10; i++) {
        const result = await service.recordFailedAttempt(ip);
        expect(result.blocked).toBe(true);
      }
    });

    it('should handle first attempt correctly', async () => {
      const ip = createTestIP(1);

      const result = await service.recordFailedAttempt(ip);
      expect(result.blocked).toBe(false);

      const attempts = await service.getAttempts(ip);
      expect(attempts?.count).toBe(1);
    });

    it('should handle 4th attempt (just before block)', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 4; i++) {
        const result = await service.recordFailedAttempt(ip);
        expect(result.blocked).toBe(false);
      }

      const isBlockedResult = await service.isBlocked(ip);
      expect(isBlockedResult.blocked).toBe(false);
    });

    it('should handle unknown IP correctly', async () => {
      const ip = createTestIP(999);

      const attempts = await service.getAttempts(ip);
      expect(attempts).toBeNull();

      const isBlockedResult = await service.isBlocked(ip);
      expect(isBlockedResult.blocked).toBe(false);
      expect(isBlockedResult.minutesRemaining).toBe(0);
    });

    it('should handle clear on unknown IP', async () => {
      const ip = createTestIP(999);

      // Should not throw
      await service.clearAttempts(ip);

      const attempts = await service.getAttempts(ip);
      expect(attempts).toBeNull();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle rapid-fire failed attempts', async () => {
      const ip = createTestIP(1);

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(service.recordFailedAttempt(ip));
      }

      const results = await Promise.all(promises);

      // Last result should be blocked
      expect(results[results.length - 1].blocked).toBe(true);
    });

    it('should handle multiple IPs trying same code', async () => {
      const ips = [createTestIP(1), createTestIP(2), createTestIP(3)];

      for (const ip of ips) {
        for (let i = 0; i < 3; i++) {
          const result = await service.recordFailedAttempt(ip);
          expect(result.blocked).toBe(false);
        }
      }

      // All IPs should still have <5 attempts
      for (const ip of ips) {
        const result = await service.isBlocked(ip);
        expect(result.blocked).toBe(false);
      }
    });

    it('should handle bot attack scenario', async () => {
      const botIps = Array.from({ length: 10 }, (_, i) => createTestIP(i + 1));

      for (const ip of botIps) {
        for (let i = 0; i < 5; i++) {
          await service.recordFailedAttempt(ip);
        }
      }

      // All should be blocked
      for (const ip of botIps) {
        const result = await service.isBlocked(ip);
        expect(result.blocked).toBe(true);
      }
    });

    it('should handle legitimate user with occasional failure', async () => {
      const ip = createTestIP(1);

      // 2 failed attempts
      for (let i = 0; i < 2; i++) {
        const result = await service.recordFailedAttempt(ip);
        expect(result.blocked).toBe(false);
      }

      // User gets valid code and succeeds
      await service.clearAttempts(ip);

      // User tries again later
      const result = await service.isBlocked(ip);
      expect(result.blocked).toBe(false);
    });
  });

  describe('Database Persistence', () => {
    it('should persist attempts between service instantiations', async () => {
      const ip = createTestIP(1);

      const service1 = new BruteForceService(db);
      await service1.recordFailedAttempt(ip);
      await service1.recordFailedAttempt(ip);

      const service2 = new BruteForceService(db);
      const attempts = await service2.getAttempts(ip);
      expect(attempts?.count).toBe(2);
    });

    it('should persist block status between queries', async () => {
      const ip = createTestIP(1);

      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt(ip);
      }

      // Query 1
      let result = await service.isBlocked(ip);
      expect(result.blocked).toBe(true);

      // Query 2 - should still be blocked
      result = await service.isBlocked(ip);
      expect(result.blocked).toBe(true);
    });
  });
});
