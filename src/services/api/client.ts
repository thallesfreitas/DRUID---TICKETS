/**
 * API Client - Camada de abstração para chamadas HTTP
 */

import { ApiError } from '../../types/api';
import { TIMEOUTS } from '../../constants/api';

export class ApiClient {
  /**
   * Realiza requisição genérica
   */
  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<T> {
    try {
      const response = await fetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Erro na requisição';
        throw new ApiError(errorMessage, response.status);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        'Erro de conexão. Tente novamente.',
        undefined
      );
    }
  }

  /**
   * GET request
   */
  async get<T = any>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  /**
   * POST request
   */
  async post<T = any>(path: string, body: any): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  /**
   * PUT request
   */
  async put<T = any>(path: string, body: any): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

// Singleton instance
export const apiClient = new ApiClient();
