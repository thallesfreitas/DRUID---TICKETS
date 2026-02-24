/**
 * SettingsService - Gerenciamento de configurações da promoção
 */

import { DatabaseClient } from '../database/client.js';
import { Settings, SettingsData, AppError } from '../types/index.js';
import { QUERIES } from '../constants/queries.js';

export class SettingsService {
  constructor(private db: DatabaseClient) {}

  /**
   * Obtém todas as configurações
   */
  async getAll(): Promise<SettingsData> {
    const results = await this.db.execute<Settings>(QUERIES.GET_ALL_SETTINGS);

    const settings: SettingsData = {
      start_date: '',
      end_date: '',
    };

    results.forEach(row => {
      if (row.key in settings) {
        settings[row.key as keyof SettingsData] = row.value;
      }
    });

    return settings;
  }

  /**
   * Obtém uma configuração específica
   */
  async get(key: string): Promise<string | null> {
    const results = await this.db.execute<Settings>(
      { sql: QUERIES.GET_SETTING, args: [key] }
    );
    return results[0]?.value || null;
  }

  /**
   * Atualiza uma configuração
   */
  async update(key: string, value: string): Promise<void> {
    await this.db.execute(
      { sql: QUERIES.UPDATE_SETTING, args: [value, key] }
    );
  }

  /**
   * Atualiza múltiplas configurações
   */
  async updateMany(data: SettingsData): Promise<void> {
    const statements = [
      { sql: QUERIES.UPDATE_SETTING, args: [data.start_date || '', 'start_date'] },
      { sql: QUERIES.UPDATE_SETTING, args: [data.end_date || '', 'end_date'] },
    ];

    await this.db.batch(statements, 'write');
  }

  /**
   * Valida se promoção começou
   */
  async isStarted(): Promise<boolean> {
    const settings = await this.getAll();
    if (!settings.start_date) return true;
    return new Date(settings.start_date) <= new Date();
  }

  /**
   * Valida se promoção terminou
   */
  async isEnded(): Promise<boolean> {
    const settings = await this.getAll();
    if (!settings.end_date) return false;
    return new Date(settings.end_date) < new Date();
  }
}
