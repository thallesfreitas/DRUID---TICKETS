/**
 * Constantes de API do Frontend
 */

export const API_PATHS = {
  PUBLIC: {
    HEALTH: '/api/health',
    SETTINGS: '/api/settings',
    REDEEM: '/api/redeem',
    REQUEST_VERIFICATION: '/api/request-verification',
    REDEEM_INFLUENCER: '/api/redeem-influencer',
    STATS: '/api/stats',
  },
  ADMIN: {
    REQUEST_CODE: '/api/admin/request-code',
    VERIFY_CODE: '/api/admin/verify-code',
    CODES: '/api/admin/codes',
    SETTINGS: '/api/admin/settings',
    UPLOAD_CSV: '/api/admin/upload-csv',
    IMPORT_STATUS: '/api/admin/import-status',
    EXPORT_REDEEMED: '/api/admin/export-redeemed',
    EMAIL_REDEMPTIONS: '/api/admin/email-redemptions',
  },
} as const;

export const TIMEOUTS = {
  FETCH: 30000,
  POLLING: 1000,
} as const;

export const API_DEFAULTS = {
  CODES_PAGE_SIZE: 50,
} as const;
