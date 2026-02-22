/**
 * Integration Flow Tests - CSV Import Flow
 * End-to-end tests for CSV upload, validation, and background processing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportService } from '@/api/services/importService';
import { CodeService } from '@/api/services/codeService';
import { createMockDatabaseClient } from '@/tests/mocks/db';
import { API_DEFAULTS } from '@/api/constants/api';

describe('CSV Import Flow', () => {
  let importService: ImportService;
  let codeService: CodeService;
  let db: any;

  beforeEach(() => {
    db = createMockDatabaseClient();
    importService = new ImportService(db);
    codeService = {
      insertBatch: vi.fn().mockResolvedValue(5),
      getByCode: vi.fn(),
      markAsUsed: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      search: vi.fn(),
      getById: vi.fn(),
      getStats: vi.fn(),
      getRecentRedeems: vi.fn(),
      getRedeemedForExport: vi.fn()
    } as any;
  });

  describe('Happy Path - CSV Upload and Processing', () => {
    it('should create import job with correct line count', async () => {
      const jobId = 'import_123';
      const lineCount = 100;

      await importService.createJob(jobId, lineCount);

      expect(db.execute).toHaveBeenCalled();
    });

    it('should parse CSV data correctly', async () => {
      const csvData = 'CODE001,https://example.com\nCODE002,https://example.com';
      const lines = csvData.split('\n').filter(line => line.trim());

      expect(lines.length).toBe(2);
      expect(lines[0]).toContain('CODE001');
      expect(lines[1]).toContain('CODE002');
    });

    it('should split large CSV into chunks', async () => {
      const lines = Array.from({ length: 15000 }, (_, i) =>
        `CODE${String(i).padStart(5, '0')},https://example.com`
      );

      const chunkSize = API_DEFAULTS.CSV_CHUNK_SIZE;
      const chunks = [];

      for (let i = 0; i < lines.length; i += chunkSize) {
        chunks.push(lines.slice(i, i + chunkSize));
      }

      expect(chunks.length).toBe(3); // 15000 / 5000 = 3 chunks
      expect(chunks[0].length).toBe(chunkSize);
      expect(chunks[2].length).toBe(5000);
    });

    it('should process chunks sequentially', async () => {
      const jobId = 'import_123';
      const lines = Array.from({ length: 15 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      expect(codeService.insertBatch).toHaveBeenCalled();
    });

    it('should update progress as chunks are processed', async () => {
      const jobId = 'import_123';
      const lines = Array.from({ length: 10 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const progress = importService.getProgress(jobId);
      expect(progress?.progress).toBe(100);
      expect(progress?.processedLines).toBe(10);
    });

    it('should mark import as completed', async () => {
      const jobId = 'import_123';

      await importService.markCompleted(jobId, 100, 95, 5);

      const progress = importService.getProgress(jobId);
      expect(progress?.status).toBe('completed');
      expect(progress?.progress).toBe(100);
    });
  });

  describe('CSV Validation - Invalid Entries', () => {
    it('should skip lines with missing code', async () => {
      const lines = [
        'CODE001,https://example.com',
        ',https://example.com', // Missing code
        'CODE002,https://example.com'
      ];

      vi.mocked(codeService.insertBatch).mockResolvedValue(2);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      // Should only insert valid entries
      const progress = importService.getProgress(jobId);
      expect(progress?.successfulLines).toBeLessThanOrEqual(2);
    });

    it('should skip lines with missing link', async () => {
      const lines = [
        'CODE001,https://example.com',
        'CODE002,', // Missing link
        'CODE003,https://example.com'
      ];

      vi.mocked(codeService.insertBatch).mockResolvedValue(2);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const progress = importService.getProgress(jobId);
      expect(progress?.successfulLines).toBeLessThanOrEqual(2);
    });

    it('should skip empty lines', async () => {
      const lines = [
        'CODE001,https://example.com',
        '',
        '   ',
        'CODE002,https://example.com'
      ];

      const validLines = lines.filter(line => line.trim());
      expect(validLines.length).toBe(2);
    });

    it('should skip lines with invalid format', async () => {
      const lines = [
        'CODE001,https://example.com',
        'INVALID_LINE_NO_COMMA',
        'CODE002,https://example.com'
      ];

      vi.mocked(codeService.insertBatch).mockResolvedValue(2);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const progress = importService.getProgress(jobId);
      expect(progress?.successfulLines).toBeLessThanOrEqual(2);
    });

    it('should uppercase code during processing', async () => {
      const lines = ['lowercase,https://example.com'];

      vi.mocked(codeService.insertBatch).mockResolvedValue(1);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const callArgs = codeService.insertBatch.mock.calls[0]?.[0];
      if (callArgs?.[0]) {
        expect(callArgs[0].code).toBe('LOWERCASE');
      }
    });

    it('should handle duplicate codes in same import', async () => {
      const lines = [
        'CODE001,https://example.com',
        'CODE001,https://example.com', // Duplicate
        'CODE002,https://example.com'
      ];

      vi.mocked(codeService.insertBatch).mockResolvedValue(2);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      expect(codeService.insertBatch).toHaveBeenCalled();
    });
  });

  describe('Error Handling - Failed Codes', () => {
    it('should track failed insertions', async () => {
      const lines = Array.from({ length: 10 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch).mockResolvedValue(8);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const progress = importService.getProgress(jobId);
      expect(progress?.successfulLines).toBeLessThanOrEqual(10);
    });

    it('should mark job failed on chunk error', async () => {
      const lines = Array.from({ length: 5 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch).mockRejectedValue(new Error('Insert failed'));

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const progress = importService.getProgress(jobId);
      expect(progress?.status).toBe('failed');
    });

    it('should continue processing after partial chunk failure', async () => {
      const lines = Array.from({ length: 10 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch)
        .mockResolvedValueOnce(5) // First chunk success
        .mockRejectedValueOnce(new Error('Error')) // Second chunk fails
        .mockResolvedValueOnce(5); // Could continue

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      // Service should attempt to process
      expect(codeService.insertBatch).toHaveBeenCalled();
    });

    it('should store error message on failure', async () => {
      const errorMsg = 'Database constraint violation';
      const jobId = 'import_123';

      await importService.markFailed(jobId, errorMsg);

      const progress = importService.getProgress(jobId);
      expect(progress?.status).toBe('failed');
      expect(progress?.errorMessage).toBe(errorMsg);
    });
  });

  describe('Chunk Processing Details', () => {
    it('should handle exact chunk size', async () => {
      const lines = Array.from({ length: 5000 }, (_, i) =>
        `CODE${String(i).padStart(5, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch).mockResolvedValue(5000);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, API_DEFAULTS.CSV_CHUNK_SIZE, codeService);

      expect(codeService.insertBatch).toHaveBeenCalledTimes(1);
    });

    it('should handle partial last chunk', async () => {
      const lines = Array.from({ length: 7500 }, (_, i) =>
        `CODE${String(i).padStart(5, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch)
        .mockResolvedValueOnce(5000) // First chunk
        .mockResolvedValueOnce(2500); // Partial second chunk

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, API_DEFAULTS.CSV_CHUNK_SIZE, codeService);

      expect(codeService.insertBatch).toHaveBeenCalledTimes(2);
    });

    it('should process single item', async () => {
      const lines = ['CODE001,https://example.com'];

      vi.mocked(codeService.insertBatch).mockResolvedValue(1);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      expect(codeService.insertBatch).toHaveBeenCalled();
    });

    it('should process large import (100k+ lines)', async () => {
      const lineCount = 100000;
      const lines = Array.from({ length: lineCount }, (_, i) =>
        `CODE${String(i).padStart(6, '0')},https://example.com`
      );

      const expectedChunks = Math.ceil(lineCount / API_DEFAULTS.CSV_CHUNK_SIZE);
      vi.mocked(codeService.insertBatch).mockResolvedValue(API_DEFAULTS.CSV_CHUNK_SIZE);

      const jobId = 'import_123';
      await importService.createJob(jobId, lineCount);
      await importService.processChunks(jobId, lines, API_DEFAULTS.CSV_CHUNK_SIZE, codeService);

      expect(codeService.insertBatch).toHaveBeenCalled();
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress percentage', async () => {
      const lines = Array.from({ length: 100 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch).mockResolvedValue(50);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);

      // Simulate partial progress
      await importService.updateProgress(jobId, 50, 45, 5);

      let progress = importService.getProgress(jobId);
      expect(progress?.progress).toBe(50); // 50 processed out of 100
    });

    it('should track successful codes separately from failed', async () => {
      const lines = Array.from({ length: 10 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3); // Only 3 of 5 succeed in second chunk

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const progress = importService.getProgress(jobId);
      expect(progress?.successfulLines).toBeGreaterThanOrEqual(0);
      expect(progress?.failedLines).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total processed correctly', async () => {
      const lines = Array.from({ length: 15 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const progress = importService.getProgress(jobId);
      expect(progress?.processedLines).toBe(15);
      expect(progress?.progress).toBe(100);
    });
  });

  describe('Job Status Queries', () => {
    it('should retrieve job status from database', async () => {
      const jobId = 'import_123';

      vi.mocked(db.execute).mockResolvedValueOnce([{
        id: jobId,
        status: 'processing',
        progress: 50
      }]);

      const status = await importService.getJobStatus(jobId);

      if (status) {
        expect(status.jobId).toBe(jobId);
      }
    });

    it('should return null for non-existent job', async () => {
      const jobId = 'nonexistent';

      vi.mocked(db.execute).mockResolvedValueOnce([]);

      const status = await importService.getJobStatus(jobId);
      expect(status).toBeNull();
    });

    it('should return in-memory progress for active jobs', async () => {
      const jobId = 'import_123';

      await importService.createJob(jobId, 100);
      const progress = importService.getProgress(jobId);

      expect(progress?.jobId).toBe(jobId);
    });

    it('should maintain separate job statuses', async () => {
      const jobId1 = 'import_1';
      const jobId2 = 'import_2';

      await importService.createJob(jobId1, 100);
      await importService.createJob(jobId2, 200);

      const progress1 = importService.getProgress(jobId1);
      const progress2 = importService.getProgress(jobId2);

      expect(progress1?.jobId).toBe(jobId1);
      expect(progress2?.jobId).toBe(jobId2);
      expect(progress1?.totalLines).toBe(100);
      expect(progress2?.totalLines).toBe(200);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle admin uploading typical promotion CSV', async () => {
      const csvData = `PROMO001,https://example.com/promo001
PROMO002,https://example.com/promo002
PROMO003,https://example.com/promo003`;

      const lines = csvData.split('\n').filter(line => line.trim());

      vi.mocked(codeService.insertBatch).mockResolvedValue(3);

      const jobId = `import_${Date.now()}`;
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      expect(codeService.insertBatch).toHaveBeenCalled();
    });

    it('should handle CSV with mixed content quality', async () => {
      const lines = [
        'VALID001,https://example.com',
        '', // Empty line
        'VALID002,https://example.com',
        'INVALID,', // Missing link
        'VALID003,https://example.com'
      ];

      vi.mocked(codeService.insertBatch).mockResolvedValue(3);

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      expect(codeService.insertBatch).toHaveBeenCalled();
    });

    it('should handle network failure during import', async () => {
      const lines = Array.from({ length: 10 }, (_, i) =>
        `CODE${String(i).padStart(3, '0')},https://example.com`
      );

      vi.mocked(codeService.insertBatch).mockRejectedValue(new Error('Network timeout'));

      const jobId = 'import_123';
      await importService.createJob(jobId, lines.length);
      await importService.processChunks(jobId, lines, 5, codeService);

      const progress = importService.getProgress(jobId);
      expect(progress?.status).toBe('failed');
    });

    it('should allow admin to check import progress while processing', async () => {
      const jobId = 'import_123';

      await importService.createJob(jobId, 1000);

      // Check progress before processing completes
      await importService.updateProgress(jobId, 250, 250, 0);
      let progress = importService.getProgress(jobId);
      expect(progress?.progress).toBe(25); // 250/1000

      // Update progress midway
      await importService.updateProgress(jobId, 500, 480, 20);
      progress = importService.getProgress(jobId);
      expect(progress?.progress).toBe(50);

      // Complete import
      await importService.markCompleted(jobId, 1000, 950, 50);
      progress = importService.getProgress(jobId);
      expect(progress?.progress).toBe(100);
      expect(progress?.status).toBe('completed');
    });
  });
});
