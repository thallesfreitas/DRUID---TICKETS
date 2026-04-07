/**
 * Tests for StatsService
 * Statistics and reporting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatsService } from '@/api/services/statsService';
import { mockStats } from '@/tests/fixtures/stats';
import { createMockDatabaseClient } from '@/tests/mocks/db';

describe('StatsService', () => {
  let service: StatsService;
  let db: any;

  beforeEach(() => {
    db = createMockDatabaseClient();
    service = new StatsService(db);
  });

  describe('getStats', () => {
    it('should return complete statistics', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 1000 }]) // total
        .mockResolvedValueOnce([{ count: 450 }]) // used
        .mockResolvedValueOnce([{ count: 47 }]) // phase2 (email_redemptions)
        .mockResolvedValueOnce(mockStats.active.recent); // recent

      const result = await service.getStats();

      expect(result).toEqual({
        total: 1000,
        used: 450,
        used_phase1: 403,
        used_phase2: 47,
        available: 550,
        recent: mockStats.active.recent
      });
    });

    it('should calculate available correctly', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 30 }])
        .mockResolvedValueOnce([{ count: 10 }])
        .mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result.available).toBe(70);
      expect(result.used_phase1).toBe(20);
      expect(result.used_phase2).toBe(10);
    });

    it('should handle no codes', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result).toEqual({
        total: 0,
        used: 0,
        used_phase1: 0,
        used_phase2: 0,
        available: 0,
        recent: []
      });
    });

    it('should handle all codes used', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result.available).toBe(0);
      expect(result.total).toBe(result.used);
      expect(result.used_phase1).toBe(0);
      expect(result.used_phase2).toBe(100);
    });

    it('should handle null count values', async () => {
      db.execute
        .mockResolvedValueOnce([{}]) // No count
        .mockResolvedValueOnce([{}]) // No count
        .mockResolvedValueOnce([{}]) // No count phase2
        .mockResolvedValueOnce([]); // Recent

      const result = await service.getStats();

      expect(result.total).toBe(0);
      expect(result.used).toBe(0);
      expect(result.used_phase1).toBe(0);
      expect(result.used_phase2).toBe(0);
    });

    it('should include recent redeems', async () => {
      const recentCodes = [
        {
          code: 'CODE001',
          ip_address: '192.168.1.1',
          used_at: '2024-01-15 10:00:00'
        },
        {
          code: 'CODE002',
          ip_address: '192.168.1.2',
          used_at: '2024-01-15 09:59:00'
        }
      ];

      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce(recentCodes);

      const result = await service.getStats();

      expect(result.recent).toHaveLength(2);
      expect(result.recent).toEqual(recentCodes);
    });

    it('should handle recent redeems without IP', async () => {
      const recentWithoutIP = [
        {
          code: 'CODE001',
          ip_address: null,
          used_at: '2024-01-15 10:00:00'
        }
      ];

      db.execute
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce(recentWithoutIP);

      const result = await service.getStats();

      expect(result.recent[0].ip_address).toBeNull();
    });

    it('should handle large numbers', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 1000000 }])
        .mockResolvedValueOnce([{ count: 999999 }])
        .mockResolvedValueOnce([{ count: 400000 }])
        .mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result.total).toBe(1000000);
      expect(result.used).toBe(999999);
      expect(result.used_phase1).toBe(599999);
      expect(result.used_phase2).toBe(400000);
      expect(result.available).toBe(1);
    });

    it('should handle empty recent array', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 10 }])
        .mockResolvedValueOnce([{ count: 5 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result.recent).toEqual([]);
    });

    it('should make four database calls', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 50 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([]);

      await service.getStats();

      expect(db.execute).toHaveBeenCalledTimes(4);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.getStats()).rejects.toThrow('DB error');
    });

    it('should fail if total count query fails', async () => {
      db.execute.mockRejectedValueOnce(new Error('Count error'));

      await expect(service.getStats()).rejects.toThrow('Count error');
    });

    it('should fail if used count query fails', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockRejectedValueOnce(new Error('Used count error'));

      await expect(service.getStats()).rejects.toThrow('Used count error');
    });

    it('should fail if recent redeems query fails', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 50 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockRejectedValueOnce(new Error('Recent error'));

      await expect(service.getStats()).rejects.toThrow('Recent error');
    });

    it('should fail if email redemptions count query fails', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 50 }])
        .mockRejectedValueOnce(new Error('Phase2 count error'));

      await expect(service.getStats()).rejects.toThrow('Phase2 count error');
    });
  });
});
