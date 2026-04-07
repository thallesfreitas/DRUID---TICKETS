/**
 * Admin API Services - Serviços administrativos do frontend
 */

import { ApiClient } from './client';
import {
  Settings,
  Stats,
  PaginatedCodes,
  PaginatedEmailRedemptions,
  CsvUploadResponse,
  ImportStatusResponse,
} from '../../types/api';
import { API_PATHS } from '../../constants/api';
import { getAdminToken } from '../../lib/adminAuth';

export class AdminService {
  constructor(private client: ApiClient) { }

  /**
   * Obtém configurações (início/fim do resgate)
   */
  async getSettings(): Promise<Settings> {
    return this.client.get<Settings>(API_PATHS.PUBLIC.SETTINGS);
  }

  /**
   * Obtém estatísticas em tempo real (total, utilizados, disponíveis, últimos 10 resgates)
   */
  async getStats(): Promise<Stats> {
    return this.client.get<Stats>(API_PATHS.PUBLIC.STATS);
  }

  /**
   * Solicita código de login por e-mail
   */
  async requestCode(email: string): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(API_PATHS.ADMIN.REQUEST_CODE, { email });
  }

  /**
   * Valida código e retorna token
   */
  async verifyCode(email: string, code: string): Promise<{ success: boolean; token: string }> {
    return this.client.post<{ success: boolean; token: string }>(API_PATHS.ADMIN.VERIFY_CODE, {
      email,
      code,
    });
  }

  /**
   * Obtém lista de códigos
   */
  async getCodes(page: number = 1, search: string = '', status: 'all' | 'used' | 'available' = 'all'): Promise<PaginatedCodes> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    return this.client.get<PaginatedCodes>(`${API_PATHS.ADMIN.CODES}?${params.toString()}`);
  }

  async getEmailRedemptions(page: number = 1, search: string = ''): Promise<PaginatedEmailRedemptions> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    if (search.trim()) params.append('search', search.trim());

    return this.client.get<PaginatedEmailRedemptions>(
      `${API_PATHS.ADMIN.EMAIL_REDEMPTIONS}?${params.toString()}`
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
   * Inicia download de exportação (com token no header)
   */
  async exportRedeemed(): Promise<void> {
    const token = getAdminToken();
    const res = await fetch(API_PATHS.ADMIN.EXPORT_REDEEMED, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Falha ao exportar.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dataBrasilia = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      .replace(', ', '_');
    a.download = `resgates_${dataBrasilia}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
