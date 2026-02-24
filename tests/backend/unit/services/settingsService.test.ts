/**
 * Tests for SettingsService
 * Promotion settings management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from '@/api/services/settingsService';
import { mockSettings } from '@/tests/fixtures/settings';
import { createMockDatabaseClient } from '@/tests/mocks/db';

describe('SettingsService', () => {
  let service: SettingsService;
  let db: any;

  beforeEach(() => {
    db = createMockDatabaseClient();
    service = new SettingsService(db);
  });

  describe('getAll', () => {
    it('should return all settings', async () => {
      const settings = [
        { key: 'start_date', value: '2024-01-01 00:00:00' },
        { key: 'end_date', value: '2024-12-31 23:59:59' }
      ];
      db.execute.mockResolvedValue(settings);

      const result = await service.getAll();

      expect(result).toEqual({
        start_date: '2024-01-01 00:00:00',
        end_date: '2024-12-31 23:59:59'
      });
    });

    it('should return empty strings if no settings', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual({
        start_date: '',
        end_date: ''
      });
    });

    it('should ignore unknown keys', async () => {
      const settings = [
        { key: 'start_date', value: '2024-01-01 00:00:00' },
        { key: 'unknown_key', value: 'some value' }
      ];
      db.execute.mockResolvedValue(settings);

      const result = await service.getAll();

      expect(result).toEqual({
        start_date: '2024-01-01 00:00:00',
        end_date: ''
      });
      expect(result).not.toHaveProperty('unknown_key');
    });

    it('should handle partial settings', async () => {
      const settings = [{ key: 'start_date', value: '2024-01-01 00:00:00' }];
      db.execute.mockResolvedValue(settings);

      const result = await service.getAll();

      expect(result.start_date).toBe('2024-01-01 00:00:00');
      expect(result.end_date).toBe('');
    });
  });

  describe('get', () => {
    it('should return setting by key', async () => {
      db.execute.mockResolvedValue([{ key: 'start_date', value: '2024-01-01 00:00:00' }]);

      const result = await service.get('start_date');

      expect(result).toBe('2024-01-01 00:00:00');
    });

    it('should return null if key not found', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle empty value', async () => {
      db.execute.mockResolvedValue([{ key: 'start_date', value: '' }]);

      const result = await service.get('start_date');

      expect(result).toBe('');
    });
  });

  describe('update', () => {
    it('should update setting', async () => {
      await service.update('start_date', '2024-06-01 00:00:00');

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['2024-06-01 00:00:00', 'start_date']
        })
      );
    });

    it('should clear setting with empty value', async () => {
      await service.update('end_date', '');

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['', 'end_date']
        })
      );
    });
  });

  describe('updateMany', () => {
    it('should update multiple settings', async () => {
      const data = {
        start_date: '2024-01-01 00:00:00',
        end_date: '2024-12-31 23:59:59'
      };

      await service.updateMany(data);

      expect(db.batch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            args: ['2024-01-01 00:00:00', 'start_date']
          }),
          expect.objectContaining({
            args: ['2024-12-31 23:59:59', 'end_date']
          })
        ]),
        'write'
      );
    });

    it('should handle empty values', async () => {
      const data = {
        start_date: '',
        end_date: ''
      };

      await service.updateMany(data);

      expect(db.batch).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const data = {
        start_date: '2024-01-01 00:00:00',
        end_date: ''
      };

      await service.updateMany(data);

      expect(db.batch).toHaveBeenCalled();
    });
  });

  describe('isStarted', () => {
    it('should return true if promotion already started', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      db.execute.mockResolvedValue([
        { key: 'start_date', value: pastDate.toISOString() }
      ]);

      const result = await service.isStarted();

      expect(result).toBe(true);
    });

    it('should return false if promotion not yet started', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      db.execute.mockResolvedValue([
        { key: 'start_date', value: futureDate.toISOString() }
      ]);

      const result = await service.isStarted();

      expect(result).toBe(false);
    });

    it('should return true if no start date (always started)', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.isStarted();

      expect(result).toBe(true);
    });

    it('should return true if start date is now', async () => {
      const now = new Date();

      db.execute.mockResolvedValue([
        { key: 'start_date', value: now.toISOString() }
      ]);

      const result = await service.isStarted();

      expect(result).toBe(true);
    });
  });

  describe('isEnded', () => {
    it('should return true if promotion already ended', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      db.execute.mockResolvedValue([
        { key: 'end_date', value: pastDate.toISOString() }
      ]);

      const result = await service.isEnded();

      expect(result).toBe(true);
    });

    it('should return false if promotion not yet ended', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      db.execute.mockResolvedValue([
        { key: 'end_date', value: futureDate.toISOString() }
      ]);

      const result = await service.isEnded();

      expect(result).toBe(false);
    });

    it('should return false if no end date (never ends)', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.isEnded();

      expect(result).toBe(false);
    });

    it('should return true if end date is just past', async () => {
      const pastDate = new Date();
      pastDate.setSeconds(pastDate.getSeconds() - 1);

      db.execute.mockResolvedValue([
        { key: 'end_date', value: pastDate.toISOString() }
      ]);

      const result = await service.isEnded();

      expect(result).toBe(true);
    });

    it('should return false if end date is now (not yet ended)', async () => {
      const now = new Date();

      db.execute.mockResolvedValue([
        { key: 'end_date', value: now.toISOString() }
      ]);

      const result = await service.isEnded();

      expect(result).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle active promotion', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      db.execute.mockResolvedValue([
        { key: 'start_date', value: pastDate.toISOString() },
        { key: 'end_date', value: futureDate.toISOString() }
      ]);

      const started = await service.isStarted();
      const ended = await service.isEnded();

      expect(started).toBe(true);
      expect(ended).toBe(false);
    });

    it('should handle promotion not yet started', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);

      db.execute.mockResolvedValue([
        { key: 'start_date', value: futureStart.toISOString() }
      ]);

      const started = await service.isStarted();

      expect(started).toBe(false);
    });

    it('should handle ended promotion', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      db.execute.mockResolvedValue([
        { key: 'end_date', value: pastDate.toISOString() }
      ]);

      const ended = await service.isEnded();

      expect(ended).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.getAll()).rejects.toThrow('DB error');
    });

    it('should propagate errors in get', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.get('key')).rejects.toThrow('DB error');
    });

    it('should propagate errors in update', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.update('key', 'value')).rejects.toThrow('DB error');
    });

    it('should propagate errors in updateMany', async () => {
      db.batch.mockRejectedValue(new Error('Batch error'));

      await expect(service.updateMany({
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })).rejects.toThrow('Batch error');
    });
  });
});
