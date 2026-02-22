/**
 * Mock data for stats-related tests
 */

export const mockStats = {
  active: {
    total: 1000,
    used: 450,
    available: 550,
    recent: [
      {
        id: 1,
        code: 'CODE0001',
        link: 'https://example.com',
        is_used: 1,
        used_at: '2024-01-15 10:30:00',
        ip_address: '192.168.1.100'
      },
      {
        id: 2,
        code: 'CODE0002',
        link: 'https://example.com',
        is_used: 1,
        used_at: '2024-01-15 10:25:00',
        ip_address: '192.168.1.101'
      },
      {
        id: 3,
        code: 'CODE0003',
        link: 'https://example.com',
        is_used: 1,
        used_at: '2024-01-15 10:20:00',
        ip_address: '192.168.1.102'
      }
    ]
  },

  empty: {
    total: 0,
    used: 0,
    available: 0,
    recent: []
  },

  almostFull: {
    total: 100,
    used: 99,
    available: 1,
    recent: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      code: `CODE${String(i).padStart(4, '0')}`,
      link: 'https://example.com',
      is_used: 1,
      used_at: `2024-01-15 ${String(10 + i).padStart(2, '0')}:00:00`,
      ip_address: `192.168.1.${100 + i}`
    }))
  }
};

export type MockStats = typeof mockStats.active;
