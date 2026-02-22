/**
 * Mock ApiClient for frontend tests
 */

import { vi } from 'vitest';

export interface MockApiClient {
  request: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

export function createMockApiClient(): MockApiClient {
  return {
    request: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({})
  };
}

/**
 * Create mock services for frontend tests
 */
export function createMockPublicService() {
  return {
    getSettings: vi.fn().mockResolvedValue({
      id: 1,
      start_date: '2024-01-01 00:00:00',
      end_date: '2024-12-31 23:59:59'
    }),
    redeem: vi.fn().mockResolvedValue({
      success: true,
      message: 'Código resgatado com sucesso!',
      link: 'https://example.com/offer'
    }),
    getStats: vi.fn().mockResolvedValue({
      total: 1000,
      used: 450,
      available: 550,
      recent: []
    }),
    getHealth: vi.fn().mockResolvedValue({ status: 'ok' })
  };
}

export function createMockAdminService() {
  return {
    login: vi.fn().mockResolvedValue({
      success: true,
      token: 'mock-token'
    }),
    getCodes: vi.fn().mockResolvedValue({
      codes: [],
      total: 0,
      page: 1,
      pageSize: 20
    }),
    uploadCsv: vi.fn().mockResolvedValue({
      jobId: 'job-123',
      status: 'processing'
    }),
    getImportStatus: vi.fn().mockResolvedValue({
      jobId: 'job-123',
      status: 'completed',
      imported: 100,
      failed: 0
    }),
    exportRedeemed: vi.fn().mockResolvedValue({
      fileName: 'redeemed-codes.csv',
      size: 1024
    })
  };
}

export type MockPublicService = ReturnType<typeof createMockPublicService>;
export type MockAdminService = ReturnType<typeof createMockAdminService>;
