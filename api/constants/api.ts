/**
 * Constantes da API
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
} as const;

export const API_DEFAULTS = {
  CODES_PAGE_SIZE: 50,
  CSV_CHUNK_SIZE: 5000,
  BRUTE_FORCE_MAX_ATTEMPTS: 5,
  BRUTE_FORCE_BLOCK_DURATION_MIN: 15,
  IMPORT_POLLING_INTERVAL_MS: 100,
  VERIFICATION_CODE_EXPIRY_MIN: 10,
  VERIFICATION_CODE_MAX_ATTEMPTS: 5,
} as const;

export const ENDPOINT_PATHS = {
  PUBLIC: {
    HEALTH: '/api/health',
    SETTINGS: '/api/settings',
    REDEEM: '/api/redeem',
    REQUEST_VERIFICATION: '/api/request-verification',
    REDEEM_INFLUENCER: '/api/redeem-influencer',
  },
  ADMIN: {
    LOGIN: '/api/admin/login',
    STATS: '/api/stats',
    CODES: '/api/admin/codes',
    SETTINGS: '/api/admin/settings',
    UPLOAD_CSV: '/api/admin/upload-csv',
    IMPORT_STATUS: '/api/admin/import-status',
    EXPORT_REDEEMED: '/api/admin/export-redeemed',
    EMAIL_REDEMPTIONS: '/api/admin/email-redemptions',
  },
} as const;

export const ERROR_CODES = {
  DB_NOT_CONNECTED: 'db_not_connected',
  MISSING_FIELDS: 'missing_fields',
  INVALID_CREDENTIALS: 'invalid_credentials',
  CAPTCHA_REQUIRED: 'captcha',
  INVALID_CODE: 'invalid',
  CODE_USED: 'used',
  EMAIL_ALREADY_REDEEMED: 'email_already_redeemed',
  INVALID_VERIFICATION_CODE: 'invalid_verification_code',
  VERIFICATION_CODE_EXPIRED: 'verification_code_expired',
  VERIFICATION_CODE_BLOCKED: 'verification_code_blocked',
  VERIFICATION_EMAIL_FAILED: 'verification_email_failed',
  NO_CODES_AVAILABLE: 'no_codes_available',
  PROMO_NOT_STARTED: 'not_started',
  PROMO_ENDED: 'ended',
  IP_BLOCKED: 'blocked',
  JOB_NOT_FOUND: 'job_not_found',
  INTERNAL_ERROR: 'internal_error',
} as const;

export const DB_CONFIG = {
  CONNECTION_TIMEOUT: 5000,
  QUERY_TIMEOUT: 30000,
} as const;
