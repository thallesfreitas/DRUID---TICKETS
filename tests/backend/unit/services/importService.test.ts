/**
 * Tests for ImportService
 * CSV import and processing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportService, type ImportProgress } from '@/api/services/importService';
import { createMockDatabaseClient } from '@/tests/mocks/db';

describe('ImportService', () => {
  let service: ImportService;
  let db: any;
  let mockCodeService: any;

  beforeEach(() => {
    db = createMockDatabaseClient();
    mockCodeService = {
      insertBatch: vi.fn().mockResolvedValue(5)
    };
    service = new ImportService(db);
  });

  describe('createJob', () => {
    it('should create import job', async () => {
      await service.createJob('job-123', 100);

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['job-123', 100]
        })
      );
    });

    it('should handle zero lines', async () => {
      await service.createJob('job-456', 0);

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['job-456', 0]
        })
      );
    });

    it('should handle large numbers', async () => {
      await service.createJob('job-789', 1000000);

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['job-789', 1000000]
        })
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const mockJob = {
        id: 'job-123',
        total_lines: 100,
        processed_lines: 50,
        successful_lines: 45,
        failed_lines: 5,
        status: 'processing',
        created_at: '2024-01-15 10:00:00',
        completed_at: null,
        error_message: null
      };
      db.execute.mockResolvedValue([mockJob]);

      const result = await service.getJobStatus('job-123');

      expect(result).toEqual(
        expect.objectContaining({
          jobId: 'job-123',
          progress: 50,
          totalLines: 100,
          processedLines: 50
        })
      );
    });

    it('should calculate progress percentage', async () => {
      const mockJob = {
        id: 'job-123',
        total_lines: 200,
        processed_lines: 75,
        successful_lines: 70,
        failed_lines: 5,
        status: 'processing'
      };
      db.execute.mockResolvedValue([mockJob]);

      const result = await service.getJobStatus('job-123');

      expect(result?.progress).toBe(38); // 75/200 * 100 = 37.5 → 38
    });

    it('should return null if job not found', async () => {
      db.execute.mockResolvedValue([]);

      const result = await service.getJobStatus('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle zero total lines', async () => {
      const mockJob = {
        id: 'job-123',
        total_lines: 0,
        processed_lines: 0,
        successful_lines: 0,
        failed_lines: 0,
        status: 'completed'
      };
      db.execute.mockResolvedValue([mockJob]);

      const result = await service.getJobStatus('job-123');

      expect(result?.progress).toBe(0);
    });

    it('should return 100% when completed', async () => {
      const mockJob = {
        id: 'job-123',
        total_lines: 100,
        processed_lines: 100,
        successful_lines: 95,
        failed_lines: 5,
        status: 'completed'
      };
      db.execute.mockResolvedValue([mockJob]);

      const result = await service.getJobStatus('job-123');

      expect(result?.progress).toBe(100);
    });
  });

  describe('updateProgress', () => {
    it('should update job progress', async () => {
      await service.updateProgress('job-123', 50, 45, 5);

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [50, 45, 5, 'job-123']
        })
      );
    });

    it('should handle zero progress', async () => {
      await service.updateProgress('job-123', 0, 0, 0);

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [0, 0, 0, 'job-123']
        })
      );
    });
  });

  describe('markCompleted', () => {
    it('should mark job completed', async () => {
      await service.markCompleted('job-123', 100, 95, 5);

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [100, 95, 5, 'job-123']
        })
      );
    });

    it('should update in-memory cache', async () => {
      await service.markCompleted('job-123', 100, 95, 5);

      const progress = service.getProgress('job-123');

      expect(progress).toEqual({
        jobId: 'job-123',
        status: 'completed',
        progress: 100,
        totalLines: 100,
        processedLines: 100,
        successfulLines: 95,
        failedLines: 5
      });
    });

    it('should set progress to 100%', async () => {
      await service.markCompleted('job-123', 1000, 900, 100);

      const progress = service.getProgress('job-123');

      expect(progress?.progress).toBe(100);
    });
  });

  describe('markFailed', () => {
    it('should mark job failed', async () => {
      await service.markFailed('job-123', 'Database error');

      expect(db.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['Database error', 'job-123']
        })
      );
    });

    it('should update in-memory cache', async () => {
      await service.markFailed('job-123', 'Connection timeout');

      const progress = service.getProgress('job-123');

      expect(progress).toEqual({
        jobId: 'job-123',
        status: 'failed',
        progress: 0,
        totalLines: 0,
        processedLines: 0,
        successfulLines: 0,
        failedLines: 0,
        errorMessage: 'Connection timeout'
      });
    });

    it('should store error message', async () => {
      const errorMsg = 'CSV format invalid';
      await service.markFailed('job-123', errorMsg);

      const progress = service.getProgress('job-123');

      expect(progress?.errorMessage).toBe(errorMsg);
    });
  });

  describe('processChunks', () => {
    it('should process CSV lines', async () => {
      const lines = [
        'CODE001,https://example.com',
        'CODE002,https://example.com'
      ];

      mockCodeService.insertBatch.mockResolvedValue(2);

      await service.processChunks('job-123', lines, 5, mockCodeService);

      expect(db.execute).toHaveBeenCalled();
    });

    it('should split into chunks correctly', async () => {
      const lines = Array.from({ length: 15 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );
      const chunkSize = 5;

      mockCodeService.insertBatch.mockResolvedValue(5);

      await service.processChunks('job-123', lines, chunkSize, mockCodeService);

      expect(mockCodeService.insertBatch).toHaveBeenCalledTimes(3); // 15 / 5 = 3 chunks
    });

    it('should handle last partial chunk', async () => {
      const lines = Array.from({ length: 13 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      mockCodeService.insertBatch.mockResolvedValue(5);

      await service.processChunks('job-123', lines, 5, mockCodeService);

      expect(mockCodeService.insertBatch).toHaveBeenCalledTimes(3); // 13 / 5 = 3 chunks (5, 5, 3)
    });

    it('should uppercase codes during processing', async () => {
      const lines = [
        'lowercase,https://example.com'
      ];

      mockCodeService.insertBatch.mockResolvedValue(1);

      await service.processChunks('job-123', lines, 5, mockCodeService);

      const callArgs = mockCodeService.insertBatch.mock.calls[0][0];
      expect(callArgs[0].code).toBe('LOWERCASE');
    });

    it('should filter invalid entries', async () => {
      const lines = [
        'CODE001,https://example.com',
        ',https://example.com', // Missing code
        'CODE002,' // Missing link
      ];

      mockCodeService.insertBatch.mockResolvedValue(1);

      await service.processChunks('job-123', lines, 5, mockCodeService);

      const callArgs = mockCodeService.insertBatch.mock.calls[0][0];
      expect(callArgs).toHaveLength(1); // Only 1 valid entry
    });

    it('should track progress', async () => {
      const lines = Array.from({ length: 10 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      mockCodeService.insertBatch.mockResolvedValue(5);

      await service.processChunks('job-123', lines, 5, mockCodeService);

      const progress = service.getProgress('job-123');
      expect(progress?.status).toBe('completed');
      expect(progress?.progress).toBe(100);
    });

    it('should count successful and failed lines', async () => {
      const lines = [
        'CODE001,https://example.com',
        'CODE002,https://example.com'
      ];

      mockCodeService.insertBatch.mockResolvedValue(1); // Only 1 successful

      await service.processChunks('job-123', lines, 5, mockCodeService);

      const progress = service.getProgress('job-123');
      expect(progress?.successfulLines).toBe(1);
      expect(progress?.failedLines).toBe(1);
    });

    it('should handle chunk processing error', async () => {
      const lines = [
        'CODE001,https://example.com'
      ];

      mockCodeService.insertBatch.mockRejectedValue(new Error('Insert failed'));

      await service.processChunks('job-123', lines, 5, mockCodeService);

      const progress = service.getProgress('job-123');
      expect(progress?.status).toBe('failed');
    });

    it('should use default chunk size', async () => {
      const lines = Array.from({ length: 10 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      mockCodeService.insertBatch.mockResolvedValue(5);

      await service.processChunks('job-123', lines, undefined, mockCodeService);

      expect(mockCodeService.insertBatch).toHaveBeenCalled();
    });
  });

  describe('getProgress', () => {
    it('should return in-memory progress', async () => {
      await service.markCompleted('job-123', 100, 95, 5);

      const progress = service.getProgress('job-123');

      expect(progress).toBeDefined();
      expect(progress?.status).toBe('completed');
    });

    it('should return undefined for unknown job', () => {
      const progress = service.getProgress('unknown-job');

      expect(progress).toBeUndefined();
    });

    it('should maintain separate progress per job', async () => {
      await service.markCompleted('job-1', 100, 95, 5);
      await service.markFailed('job-2', 'Error');

      const progress1 = service.getProgress('job-1');
      const progress2 = service.getProgress('job-2');

      expect(progress1?.status).toBe('completed');
      expect(progress2?.status).toBe('failed');
    });
  });

  describe('error handling', () => {
    it('should handle database errors in createJob', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.createJob('job-123', 100)).rejects.toThrow('DB error');
    });

    it('should handle errors in updateProgress', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.updateProgress('job-123', 50, 45, 5)).rejects.toThrow('DB error');
    });
  });
});
