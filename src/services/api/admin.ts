/**
 * Admin API Services - Serviços administrativos do frontend
 */

import { ApiClient } from './client';
import { Settings, PaginatedCodes, CsvUploadResponse, ImportStatusResponse } from '../../types/api';
import { API_PATHS } from '../../constants/api';

export class AdminService {
  constructor(private client: ApiClient) {}

  /**
   * Faz login admin
   */
  async login(password: string): Promise<{ success: boolean; token: string }> {
    return this.client.post(API_PATHS.ADMIN.LOGIN, { password });
  }

  /**
   * Obtém lista de códigos
   */
  async getCodes(page: number = 1, search: string = ''): Promise<PaginatedCodes> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    if (search) params.append('search', search);

    return this.client.get<PaginatedCodes>(
      `${API_PATHS.ADMIN.CODES}?${params.toString()}`
    );
  }

  /**
   * Atualiza configurações
   */
  async updateSettings(settings: Settings): Promise<{ success: boolean }> {
    return this.client.post(API_PATHS.ADMIN.SETTINGS, settings);
  }

  /**
   * Faz upload de CSV
   */
  async uploadCsv(csvData: string): Promise<CsvUploadResponse> {
    return this.client.post<CsvUploadResponse>(API_PATHS.ADMIN.UPLOAD_CSV, {
      csvData,
    });
  }

  /**
   * Obtém status da importação
   */
  async getImportStatus(jobId: string): Promise<ImportStatusResponse> {
    return this.client.get<ImportStatusResponse>(
      `${API_PATHS.ADMIN.IMPORT_STATUS}/${jobId}`
    );
  }

  /**
   * Inicia download de exportação
   */
  exportRedeemed(): void {
    window.location.href = API_PATHS.ADMIN.EXPORT_REDEEMED;
  }
}
