/**
 * ImportService - Gerenciamento de importação de códigos via CSV
 */

import { DatabaseClient } from '../database/client.js';
import { ImportJob, ImportStatusResponse } from '../types/index.js';
import { QUERIES } from '../constants/queries.js';
import { API_DEFAULTS } from '../constants/api.js';

export interface ImportProgress {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  totalLines: number;
  processedLines: number;
  successfulLines: number;
  failedLines: number;
  errorMessage?: string;
}

export class ImportService {
  private importQueue = new Map<string, ImportProgress>();

  constructor(private db: DatabaseClient) {}

  /**
   * Cria um novo job de importação
   */
  async createJob(jobId: string, totalLines: number): Promise<void> {
    await this.db.execute({
      sql: QUERIES.INSERT_IMPORT_JOB,
      args: [jobId, totalLines],
    });
  }

  /**
   * Obtém status de um job
   */
  async getJobStatus(jobId: string): Promise<ImportStatusResponse | null> {
    const results = await this.db.execute<ImportJob>(
      { sql: QUERIES.GET_IMPORT_JOB, args: [jobId] }
    );

    if (!results[0]) return null;

    const job = results[0];
    const progress = job.total_lines > 0
      ? Math.round((job.processed_lines / job.total_lines) * 100)
      : 0;

    return {
      jobId: job.id,
      status: job.status,
      progress,
      totalLines: job.total_lines,
      processedLines: job.processed_lines,
      successfulLines: job.successful_lines,
      failedLines: job.failed_lines,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      errorMessage: job.error_message,
    };
  }

  /**
   * Atualiza progresso de um job
   */
  async updateProgress(
    jobId: string,
    processedLines: number,
    successfulLines: number,
    failedLines: number
  ): Promise<void> {
    await this.db.execute({
      sql: QUERIES.UPDATE_IMPORT_JOB,
      args: [processedLines, successfulLines, failedLines, jobId],
    });
  }

  /**
   * Marca job como concluído
   */
  async markCompleted(
    jobId: string,
    totalLines: number,
    successfulLines: number,
    failedLines: number
  ): Promise<void> {
    await this.db.execute({
      sql: QUERIES.UPDATE_IMPORT_JOB_COMPLETED,
      args: [totalLines, successfulLines, failedLines, jobId],
    });

    this.importQueue.set(jobId, {
      jobId,
      status: 'completed',
      progress: 100,
      totalLines,
      processedLines: totalLines,
      successfulLines,
      failedLines,
    });
  }

  /**
   * Marca job como falhado
   */
  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    await this.db.execute({
      sql: QUERIES.UPDATE_IMPORT_JOB_FAILED,
      args: [errorMessage, jobId],
    });

    this.importQueue.set(jobId, {
      jobId,
      status: 'failed',
      progress: 0,
      totalLines: 0,
      processedLines: 0,
      successfulLines: 0,
      failedLines: 0,
      errorMessage,
    });
  }

  /**
   * Processa importação em chunks
   */
  async processChunks(
    jobId: string,
    lines: string[],
    chunkSize: number = API_DEFAULTS.CSV_CHUNK_SIZE,
    codeService: any
  ): Promise<void> {
    const totalLines = lines.length;
    const chunks: string[][] = [];

    for (let i = 0; i < lines.length; i += chunkSize) {
      chunks.push(lines.slice(i, i + chunkSize));
    }

    let successfulLines = 0;
    let failedLines = 0;

    try {
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const codes = chunk
          .map(line => {
            const parts = line.split(',').map(s => s.trim());
            const [code, link] = parts;
            return { code: code?.toUpperCase(), link };
          })
          .filter(c => c.code && c.link);

        try {
          const chunkSuccess = await codeService.insertBatch(codes);
          successfulLines += chunkSuccess;
          failedLines += chunk.length - chunkSuccess;
        } catch (chunkErr) {
          console.error('Erro no processamento do chunk:', chunkErr);
          failedLines += chunk.length;
        }

        const processedLines = Math.min((chunkIndex + 1) * chunkSize, totalLines);
        const progress = Math.min((processedLines / totalLines) * 100, 100);

        await this.updateProgress(jobId, processedLines, successfulLines, failedLines);
        this.importQueue.set(jobId, {
          jobId,
          status: 'processing',
          progress: Math.round(progress),
          totalLines,
          processedLines,
          successfulLines,
          failedLines,
        });

        if (chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, API_DEFAULTS.IMPORT_POLLING_INTERVAL_MS));
        }
      }

      await this.markCompleted(jobId, totalLines, successfulLines, failedLines);
    } catch (error) {
      console.error('Import error:', error);
      await this.markFailed(jobId, String(error));
    }
  }

  /**
   * Obtém progresso em cache (para polling)
   */
  getProgress(jobId: string): ImportProgress | undefined {
    return this.importQueue.get(jobId);
  }
}
