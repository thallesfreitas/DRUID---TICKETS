/**
 * Tests for CodeService
 * CRUD operations for promo codes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeService } from '@/api/services/codeService';
import { mockCodes } from '@/tests/fixtures/codes';
import { createMockDatabaseClient } from '@/tests/mocks/db';

describe('CodeService', () => {
  let service: CodeService;
  let db: any;

  beforeEach(() => {
    db = createMockDatabaseClient();
    service = new CodeService(db);
  });

  describe('getByCode', () => {
    it('should return code by string value', async () => {
      const mockCode = mockCodes.valid;
      db.execute.mockResolvedValue([mockCode]);

      const result = await service.getByCode('promo123');

      expect(result).toEqual(mockCode);
      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['PROMO123']
        })
      );
    });

    it('should uppercase the code before searching', async () => {
      db.execute.mockResolvedValue([mockCodes.valid]);

      await service.getByCode('lowercase_code');

      const call = db.execute.mock.calls[0][0];
      expect(call.args[0]).toBe('LOWERCASE_CODE');
    });

    it('should return null if code not found', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.getByCode('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle empty array response', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.getByCode('code');

      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return code by ID', async () => {
      const mockCode = mockCodes.valid;
      db.execute.mockResolvedValue([mockCode]);

      const result = await service.getById(1);

      expect(result).toEqual(mockCode);
      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [1]
        })
      );
    });

    it('should return null if ID not found', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.getById(999);

      expect(result).toBeNull();
    });

    it('should handle large IDs', async () => {
      db.execute.mockResolvedValue([mockCodes.valid]);

      const result = await service.getById(1000000);

      expect(result).toBeDefined();
    });
  });

  describe('markAsUsed', () => {
    it('should mark code as used with IP', async () => {
      await service.markAsUsed(1, '192.168.1.100');

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['192.168.1.100', 1]
        })
      );
    });

    it('should work with different IPs', async () => {
      const ips = ['192.168.1.1', '10.0.0.1', '127.0.0.1'];

      for (const ip of ips) {
        await service.markAsUsed(1, ip);
      }

      expect(db.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle IPv6 addresses', async () => {
      const ipv6 = '2001:0db8:85a3::8a2e:0370:7334';

      await service.markAsUsed(1, ipv6);

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [ipv6, 1]
        })
      );
    });
  });

  describe('getAll', () => {
    it('should return paginated codes', async () => {
      const mockResult = {
        codes: mockCodes.multipleUnused,
        total: 3,
        page: 1,
        totalPages: 1
      };
      db.execute
        .mockResolvedValueOnce([{ count: 3 }]) // countResult
        .mockResolvedValueOnce(mockCodes.multipleUnused); // rowsResult

      const result = await service.getAll(1);

      expect(result).toEqual(mockResult);
      expect(result.codes).toHaveLength(3);
      expect(result.totalPages).toBe(1);
    });

    it('should calculate correct pagination', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([]);

      const result = await service.getAll(3);

      // Page 3, 50 per page = offset 100
      const callArgs = db.execute.mock.calls[1][0];
      expect(callArgs.args).toContain(100); // offset
      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(2); // ceil(100/50)
    });

    it('should search codes with pattern', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([mockCodes.valid]);

      const result = await service.getAll(1, 'PROMO');

      expect(result.codes).toBeDefined();
      // Search is called with LIKE pattern
      const countCall = db.execute.mock.calls[0][0];
      expect(countCall.args[0]).toBe('%PROMO%');
    });

    it('should handle no results', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([]);

      const result = await service.getAll(1);

      expect(result.codes).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle null count gracefully', async () => {
      db.execute
        .mockResolvedValueOnce([{}]) // No count property
        .mockResolvedValueOnce([]);

      const result = await service.getAll(1);

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should default to page 1', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 50 }])
        .mockResolvedValueOnce([]);

      await service.getAll();

      const callArgs = db.execute.mock.calls[1][0];
      expect(callArgs.args[2]).toBe(0); // offset for page 1
    });
  });

  describe('insertBatch', () => {
    it('should insert multiple codes', async () => {
      const codes = [
        { code: 'CODE001', link: 'https://example.com' },
        { code: 'CODE002', link: 'https://example.com' }
      ];
      db.batch.mockResolvedValue([
        { rowsAffected: 1 },
        { rowsAffected: 1 }
      ]);

      const result = await service.insertBatch(codes);

      expect(result).toBe(2);
      expect(db.batch).toHaveBeenCalled();
    });

    it('should uppercase codes during insert', async () => {
      const codes = [{ code: 'lowercase', link: 'https://example.com' }];
      db.batch.mockResolvedValue([{ rowsAffected: 1 }]);

      await service.insertBatch(codes);

      const statements = db.batch.mock.calls[0][0];
      expect(statements[0].args[0]).toBe('LOWERCASE');
    });

    it('should filter out invalid entries', async () => {
      const codes = [
        { code: 'VALID', link: 'https://example.com' },
        { code: '', link: 'https://example.com' }, // invalid
        { code: 'VALID2', link: '' } // invalid
      ];
      db.batch.mockResolvedValue([{ rowsAffected: 1 }]);

      await service.insertBatch(codes);

      const statements = db.batch.mock.calls[0][0];
      expect(statements).toHaveLength(1); // Only 1 valid entry
    });

    it('should return 0 if all entries invalid', async () => {
      const codes = [
        { code: '', link: '' },
        { code: '', link: '' }
      ];

      const result = await service.insertBatch(codes);

      expect(result).toBe(0);
      expect(db.batch).not.toHaveBeenCalled();
    });

    it('should count only affected rows', async () => {
      const codes = [
        { code: 'CODE1', link: 'https://example.com' },
        { code: 'CODE2', link: 'https://example.com' },
        { code: 'CODE3', link: 'https://example.com' }
      ];
      db.batch.mockResolvedValue([
        { rowsAffected: 1 }, // inserted
        { rowsAffected: 0 }, // duplicate
        { rowsAffected: 1 }  // inserted
      ]);

      const result = await service.insertBatch(codes);

      expect(result).toBe(2);
    });

    it('should handle large batch', async () => {
      const codes = Array.from({ length: 1000 }, (_, i) => ({
        code: `CODE${String(i).padStart(5, '0')}`,
        link: 'https://example.com'
      }));
      db.batch.mockResolvedValue(
        codes.map(() => ({ rowsAffected: 1 }))
      );

      const result = await service.insertBatch(codes);

      expect(result).toBe(1000);
    });
  });

  describe('getStats', () => {
    it('should return code statistics', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 1000 }]) // total
        .mockResolvedValueOnce([{ count: 450 }]); // used

      const result = await service.getStats();

      expect(result).toEqual({
        total: 1000,
        used: 450,
        available: 550
      });
    });

    it('should calculate available correctly', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 75 }]);

      const result = await service.getStats();

      expect(result.available).toBe(25);
    });

    it('should handle no codes', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.getStats();

      expect(result).toEqual({
        total: 0,
        used: 0,
        available: 0
      });
    });

    it('should handle null count values', async () => {
      db.execute
        .mockResolvedValueOnce([{}]) // No count
        .mockResolvedValueOnce([{}]); // No count

      const result = await service.getStats();

      expect(result.total).toBe(0);
      expect(result.used).toBe(0);
    });

    it('should handle all codes used', async () => {
      db.execute
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ count: 100 }]);

      const result = await service.getStats();

      expect(result.available).toBe(0);
    });
  });

  describe('getRecentRedeems', () => {
    it('should return recent redeems', async () => {
      const recentCodes = [mockCodes.used];
      db.execute.mockResolvedValue(recentCodes);

      const result = await service.getRecentRedeems();

      expect(result).toEqual(recentCodes);
    });

    it('should respect limit parameter', async () => {
      db.execute.mockResolvedValue([]);

      await service.getRecentRedeems(20);

      // Verify the query was called (limit is in the query)
      expect(db.execute).toHaveBeenCalled();
    });

    it('should return empty array if none', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.getRecentRedeems();

      expect(result).toEqual([]);
    });
  });

  describe('getRedeemedForExport', () => {
    it('should return redeemed codes for export', async () => {
      const redeemedCodes = [mockCodes.used];
      db.execute.mockResolvedValue(redeemedCodes);

      const result = await service.getRedeemedForExport();

      expect(result).toEqual(redeemedCodes);
    });

    it('should handle no redeemed codes', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.getRedeemedForExport();

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors in getByCode', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.getByCode('code')).rejects.toThrow('DB error');
    });

    it('should propagate database errors in insertBatch', async () => {
      const codes = [{ code: 'CODE', link: 'https://example.com' }];
      db.batch.mockRejectedValue(new Error('Batch failed'));

      await expect(service.insertBatch(codes)).rejects.toThrow('Batch failed');
    });

    it('should propagate database errors in getStats', async () => {
      db.execute.mockRejectedValue(new Error('Stats error'));

      await expect(service.getStats()).rejects.toThrow('Stats error');
    });
  });
});
