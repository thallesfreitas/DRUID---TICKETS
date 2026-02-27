/**
 * API Client - Camada de abstração para chamadas HTTP
 */

import { ApiError } from '../../types/api';
import { TIMEOUTS } from '../../constants/api';
import { getAdminToken, clearAdminToken } from '../../lib/adminAuth';

const ADMIN_AUTH_PATHS = ['/api/admin/request-code', '/api/admin/verify-code'];

function isAdminProtectedPath(path: string): boolean {
  if (!path.startsWith('/api/admin/')) return false;
  return !ADMIN_AUTH_PATHS.some((p) => path.startsWith(p));
}

export class ApiClient {
  /**
   * Realiza requisição genérica
   */
  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.FETCH);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (isAdminProtectedPath(path)) {
      const token = getAdminToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        // Token expirado ou inválido: limpa e redireciona pro login
        if (response.status === 401 && isAdminProtectedPath(path)) {
          clearAdminToken();
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        const errorMessage = data.message || data.error || 'Erro na requisição';
        throw new ApiError(errorMessage, response.status);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Tempo esgotado. Verifique se o servidor está em execução.', undefined);
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
