/**
 * Mock data for brute force protection tests
 */

export const mockBruteForce = {
  attempt0: {
    ip_address: '192.168.1.100',
    failed_attempts: 0,
    last_attempt_at: null,
    blocked_until: null
  },

  attempt3: {
    ip_address: '192.168.1.101',
    failed_attempts: 3,
    last_attempt_at: '2024-01-15 10:00:00',
    blocked_until: null
  },

  attempt5Blocked: {
    ip_address: '192.168.1.102',
    failed_attempts: 5,
    last_attempt_at: '2024-01-15 10:05:00',
    blocked_until: '2024-01-15 10:20:00' // 15 minutes from last attempt
  },

  blockExpired: {
    ip_address: '192.168.1.103',
    failed_attempts: 5,
    last_attempt_at: '2024-01-15 09:45:00',
    blocked_until: '2024-01-15 10:00:00' // Already expired
  }
};

export const bruteForceScenarios = {
  newIP: {
    ip: '203.0.113.42',
    attempts: []
  },

  oneFailedAttempt: {
    ip: '198.51.100.1',
    attempts: ['INVALID1']
  },

  multipleFailedAttempts: {
    ip: '198.51.100.2',
    attempts: ['INVALID1', 'INVALID2', 'INVALID3']
  },

  failedThenSuccess: {
    ip: '198.51.100.3',
    attempts: ['INVALID1', 'INVALID2', 'PROMO123']
  }
};

export type MockBruteForceRecord = typeof mockBruteForce.attempt0;
