/**
 * Mock DatabaseClient for backend tests
 */

import { vi } from 'vitest';

export interface MockDatabaseClient {
  connect: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  batch: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

export function createMockDatabaseClient(): MockDatabaseClient {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue([]),
    batch: vi.fn().mockResolvedValue({ success: true }),
    disconnect: vi.fn().mockResolvedValue(undefined)
  };
}

/**
 * Create a mock database client with predefined return values
 */
export function createMockDatabaseClientWithDefaults(defaults: Partial<MockDatabaseClient> = {}): MockDatabaseClient {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue([]),
    batch: vi.fn().mockResolvedValue({ success: true }),
    disconnect: vi.fn().mockResolvedValue(undefined),
    ...defaults
  };
}
