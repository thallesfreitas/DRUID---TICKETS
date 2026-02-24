/**
 * Criação da aplicação Express com injeção de dependências
 */

import express from 'express';
import { dbClient } from './database/client.js';
import { CodeService } from './services/codeService.js';
import { SettingsService } from './services/settingsService.js';
import { StatsService } from './services/statsService.js';
import { BruteForceService } from './services/bruteForceService.js';
import { ImportService } from './services/importService.js';
import { RedeemService } from './services/redeemService.js';
import { AdminAuthService } from './services/adminAuthService.js';
import { EmailService } from './services/emailService.js';
import { createPublicRoutes } from './routes/public.js';
import { createAdminRoutes } from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

export async function createApp() {
  const app = express();

  // ===== Middleware =====
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ===== Inicializar banco de dados =====
  try {
    await dbClient.connect();
    await dbClient.initializeSchema();
  } catch (err) {
    console.error('CRITICAL: Database initialization failed:', err);
    // Continue mesmo se falhar, em produção isso será tratado
  }

  // ===== Instanciar serviços =====
  const codeService = new CodeService(dbClient);
  const settingsService = new SettingsService(dbClient);
  const statsService = new StatsService(dbClient);
  const bruteForceService = new BruteForceService(dbClient);
  const importService = new ImportService(dbClient);
  const redeemService = new RedeemService(codeService, settingsService, bruteForceService);
  const adminAuthService = new AdminAuthService(dbClient);
  const emailService = new EmailService();

  // ===== Registrar rotas =====
  const publicRoutes = createPublicRoutes(
    codeService,
    settingsService,
    statsService,
    bruteForceService,
    redeemService
  );
  const adminRoutes = createAdminRoutes(
    codeService,
    settingsService,
    statsService,
    importService,
    adminAuthService,
    emailService
  );

  app.use('/api', publicRoutes);
  app.use('/api/admin', adminRoutes);

  // ===== Error handler (deve ser o último middleware) =====
  app.use(errorHandler);

  return { app };
}
