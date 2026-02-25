/**
 * Admin Routes - Endpoints administrativos
 */

import { Router } from 'express';
import { CodeService } from '../services/codeService.js';
import { SettingsService } from '../services/settingsService.js';
import { StatsService } from '../services/statsService.js';
import { ImportService } from '../services/importService.js';
import { AdminAuthService } from '../services/adminAuthService.js';
import { EmailService } from '../services/emailService.js';
import { CsvUploadSchema, SettingsSchema, AdminRequestCodeSchema, AdminVerifyCodeSchema } from '../validators/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { adminAuth, signAdminToken } from '../middleware/adminAuth.js';
import { AppError, SettingsData } from '../types/index.js';
import { HTTP_STATUS, API_DEFAULTS } from '../constants/api.js';

export function createAdminRoutes(
  codeService: CodeService,
  settingsService: SettingsService,
  statsService: StatsService,
  importService: ImportService,
  adminAuthService: AdminAuthService,
  emailService: EmailService
): Router {
  const router = Router();

  /**
   * POST /api/admin/request-code - Solicita código de login por e-mail
   */
  router.post(
    '/request-code',
    asyncHandler(async (req, res) => {
      const { email } = AdminRequestCodeSchema.parse(req.body);
      const admin = await adminAuthService.findByEmail(email);
      if (!admin) {
        res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um código em instantes.' });
        return;
      }
      const { code } = await adminAuthService.createLoginCode(email);
      await emailService.sendLoginCode(email, code);
      res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um código em instantes.' });
    })
  );

  /**
   * POST /api/admin/verify-code - Valida código e retorna token
   */
  router.post(
    '/verify-code',
    asyncHandler(async (req, res) => {
      const { email, code } = AdminVerifyCodeSchema.parse(req.body);
      const row = await adminAuthService.findValidCode(email, code);
      if (!row) {
        throw new AppError('Código inválido ou expirado.', HTTP_STATUS.UNAUTHORIZED, 'invalid_code');
      }
      if (row.id !== 0) {
        await adminAuthService.deleteCode(row.id);
      }
      const admin = await adminAuthService.findByEmail(email);
      if (!admin) {
        throw new AppError('Usuário não encontrado.', HTTP_STATUS.UNAUTHORIZED, 'invalid_credentials');
      }
      const token = signAdminToken(admin.id, admin.email);
      res.json({ success: true, token });
    })
  );

  router.use(adminAuth);

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
      const settings = SettingsSchema.parse(req.body) as SettingsData;
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

      // used_at vem em UTC do banco; parse como UTC e formata em Brasília (DD/MM/YYYY HH:mm:ss)
      const formatDateBrasilia = (isoOrDateTime: string | null): string => {
        if (!isoOrDateTime || !String(isoOrDateTime).trim()) return '';
        const t = String(isoOrDateTime).trim();
        const asUtc = /Z$|[+-]\d{2}:?\d{2}$/.test(t) ? t : t.replace(' ', 'T') + 'Z';
        const s = new Date(asUtc).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        return s.replace(', ', ' ');
      };

      let csv = 'codigo,link,data,ip\n';
      rows.forEach((row: any) => {
        const dataBrasilia = formatDateBrasilia(row.used_at);
        csv += `${row.code},${row.link},${dataBrasilia},${row.ip_address || ''}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=resgates.csv');
      res.send(csv);
    })
  );

  return router;
}
