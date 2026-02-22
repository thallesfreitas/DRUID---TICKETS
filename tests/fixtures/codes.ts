/**
 * Mock data for code-related tests
 */

export const mockCodes = {
  valid: {
    id: 1,
    code: 'PROMO123',
    link: 'https://example.com/offer',
    is_used: 0,
    used_at: null,
    ip_address: null
  },

  used: {
    id: 2,
    code: 'USED001',
    link: 'https://example.com/offer',
    is_used: 1,
    used_at: '2024-01-15 10:30:00',
    ip_address: '192.168.1.100'
  },

  expired: {
    id: 3,
    code: 'EXPIRED',
    link: 'https://example.com/offer',
    is_used: 0,
    used_at: null,
    ip_address: null
  },

  multipleUnused: [
    {
      id: 4,
      code: 'CODE0001',
      link: 'https://example.com/offer',
      is_used: 0,
      used_at: null,
      ip_address: null
    },
    {
      id: 5,
      code: 'CODE0002',
      link: 'https://example.com/offer',
      is_used: 0,
      used_at: null,
      ip_address: null
    },
    {
      id: 6,
      code: 'CODE0003',
      link: 'https://example.com/offer',
      is_used: 1,
      used_at: '2024-01-10 14:00:00',
      ip_address: '192.168.1.101'
    }
  ]
};

export const invalidCodes = {
  empty: '',
  spaces: '   ',
  lowercase: 'promo123',
  special: 'PROMO@#$',
  tooShort: 'AB12',
  null: null as any,
  undefined: undefined as any
};

export type MockCode = typeof mockCodes.valid;
