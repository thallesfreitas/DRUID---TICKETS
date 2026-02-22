/**
 * Admin Routes - Endpoints administrativos
 */

import { Router } from 'express';
import { CodeService } from '../services/codeService';
import { SettingsService } from '../services/settingsService';
import { StatsService } from '../services/statsService';
import { ImportService } from '../services/importService';
import { CsvUploadSchema, SettingsSchema, AdminLoginSchema } from '../validators';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../types';
import { HTTP_STATUS, API_DEFAULTS } from '../constants/api';
import { validateCsvLines } from '../validators';

export function createAdminRoutes(
  codeService: CodeService,
  settingsService: SettingsService,
  statsService: StatsService,
  importService: ImportService
): Router {
  const router = Router();

  /**
   * POST /api/admin/login - Autenticação admin
   */
  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const { password } = AdminLoginSchema.parse(req.body);

      if (password === (process.env.ADMIN_PASSWORD || 'admin123')) {
        res.json({ success: true, token: 'mock-jwt-token' });
      } else {
        throw new AppError('Senha incorreta.', HTTP_STATUS.UNAUTHORIZED, 'invalid_credentials');
      }
    })
  );

  /**
   * GET /api/admin/codes - Listar códigos com paginação
   */
  router.get(
    '/codes',
    asyncHandler(async (req, res) => {
      const page = parseInt(req.query.page as string) || 1;
      const search = req.query.search as string;

      const result = await codeService.getAll(page, search);
      res.json(result);
    })
  );

  /**
   * POST /api/admin/settings - Atualizar configurações
   */
  router.post(
    '/settings',
    asyncHandler(async (req, res) => {
      const settings = SettingsSchema.parse(req.body);
      await settingsService.updateMany(settings);
      res.json({ success: true });
    })
  );

  /**
   * POST /api/admin/upload-csv - Iniciar importação de CSV
   */
  router.post(
    '/upload-csv',
    asyncHandler(async (req, res) => {
      const { csvData } = CsvUploadSchema.parse(req.body);

      const lines = csvData
        .split('\n')
        .filter((line: string) => line.trim());

      if (lines.length === 0) {
        throw new AppError('CSV vazio ou inválido.', HTTP_STATUS.BAD_REQUEST);
      }

      const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar job
      await importService.createJob(jobId, lines.length);

      // Processar em background
      importService
        .processChunks(jobId, lines, API_DEFAULTS.CSV_CHUNK_SIZE, codeService)
        .catch((err) => {
          console.error('Background import failed:', err);
        });

      res.json({
        success: true,
        jobId,
        message: `Importação iniciada. Processando ${lines.length} linhas em chunks de ${API_DEFAULTS.CSV_CHUNK_SIZE / 1000}k...`,
        totalLines: lines.length,
      });
    })
  );

  /**
   * GET /api/admin/import-status/:jobId - Status da importação
   */
  router.get(
    '/import-status/:jobId',
    asyncHandler(async (req, res) => {
      const { jobId } = req.params;

      // Tentar obter do banco
      const status = await importService.getJobStatus(jobId);

      if (!status) {
        throw new AppError('Job não encontrado.', HTTP_STATUS.NOT_FOUND, 'job_not_found');
      }

      res.json(status);
    })
  );

  /**
   * GET /api/admin/export-redeemed - Exportar códigos resgatados
   */
  router.get(
    '/export-redeemed',
    asyncHandler(async (req, res) => {
      const rows = await codeService.getRedeemedForExport();

      // Converter para CSV
      let csv = 'codigo,link,data,ip\n';
      rows.forEach((row: any) => {
        csv += `${row.code},${row.link},${row.used_at},${row.ip_address}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=resgates.csv');
      res.send(csv);
    })
  );

  return router;
}
