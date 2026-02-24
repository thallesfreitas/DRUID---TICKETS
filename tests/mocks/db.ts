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
  // In-memory store for brute_force_attempts to support BruteForceService flows
  type BruteForceRow = {
    ip: string;
    attempts: number;
    last_attempt: string | null;
    blocked_until: string | null;
  };

  const bruteForceStore = new Map<string, BruteForceRow>();

  const execute = vi.fn(async (query: any) => {
    // Simple passthrough for string queries
    if (typeof query === 'string') {
      return [];
    }

    const { sql, args = [] } = query as { sql: string; args?: any[] };

    if (typeof sql === 'string') {
      // SELECT * FROM brute_force_attempts WHERE ip = ?
      if (sql.includes('FROM brute_force_attempts')) {
        const ip = args[0] as string;
        const row = bruteForceStore.get(ip);
        return row ? [row] : [];
      }

      // INSERT / UPDATE brute_force_attempts (upsert)
      if (sql.includes('INSERT INTO brute_force_attempts')) {
        const [ip, attempts, last_attempt, blocked_until] = args as [
          string,
          number,
          string | null,
          string | null
        ];
        bruteForceStore.set(ip, { ip, attempts, last_attempt, blocked_until });
        return [];
      }

      // DELETE FROM brute_force_attempts WHERE ip = ?
      if (sql.includes('DELETE FROM brute_force_attempts')) {
        const ip = args[0] as string;
        bruteForceStore.delete(ip);
        return [];
      }
    }

    // Default: return empty result
    return [];
  });

  return {
    connect: vi.fn().mockResolvedValue(undefined),
    execute,
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
