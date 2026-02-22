/**
 * Mock data for settings-related tests
 */

export const mockSettings = {
  active: {
    id: 1,
    start_date: '2024-01-01 00:00:00',
    end_date: '2024-12-31 23:59:59',
    created_at: '2024-01-01 00:00:00',
    updated_at: '2024-01-01 00:00:00'
  },

  notStarted: {
    id: 2,
    start_date: '2025-06-01 00:00:00',
    end_date: '2025-12-31 23:59:59',
    created_at: '2024-01-01 00:00:00',
    updated_at: '2024-01-01 00:00:00'
  },

  ended: {
    id: 3,
    start_date: '2023-01-01 00:00:00',
    end_date: '2023-12-31 23:59:59',
    created_at: '2023-01-01 00:00:00',
    updated_at: '2023-12-31 23:59:59'
  }
};

export const invalidSettings = {
  emptyDate: {
    start_date: '',
    end_date: '2024-12-31 23:59:59'
  },

  invalidFormat: {
    start_date: 'invalid',
    end_date: '2024-12-31 23:59:59'
  },

  reversedDates: {
    start_date: '2024-12-31 23:59:59',
    end_date: '2024-01-01 00:00:00'
  },

  nullValue: {
    start_date: null,
    end_date: null
  }
};

export type MockSettings = typeof mockSettings.active;
