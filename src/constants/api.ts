/**
 * Constantes de API do Frontend
 */

export const API_PATHS = {
  PUBLIC: {
    HEALTH: '/api/health',
    SETTINGS: '/api/settings',
    REDEEM: '/api/redeem',
    STATS: '/api/stats',
  },
  ADMIN: {
    LOGIN: '/api/admin/login',
    CODES: '/api/admin/codes',
    SETTINGS: '/api/admin/settings',
    UPLOAD_CSV: '/api/admin/upload-csv',
    IMPORT_STATUS: '/api/admin/import-status',
    EXPORT_REDEEMED: '/api/admin/export-redeemed',
  },
} as const;

export const TIMEOUTS = {
  FETCH: 30000,
  POLLING: 1000,
} as const;

export const API_DEFAULTS = {
  CODES_PAGE_SIZE: 50,
} as const;
