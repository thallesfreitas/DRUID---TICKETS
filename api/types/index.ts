/**
 * Tipos e interfaces compartilhadas do Backend
 */

export interface Code {
  id: number;
  code: string;
  link: string;
  is_used: boolean;
  used_at: string | null;
  ip_address: string | null;
}

export interface Settings {
  key: string;
  value: string;
}

export interface BruteForceAttempt {
  ip: string;
  attempts: number;
  last_attempt: string;
  blocked_until: string | null;
}

export interface ImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_lines: number;
  processed_lines: number;
  successful_lines: number;
  failed_lines: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface Stats {
  total: number;
  used: number;
  /** Resgates pelo fluxo cupom único (sem linha em email_redemptions) */
  used_phase1: number;
  /** Resgates pelo fluxo e-mail + OTP (linhas em email_redemptions) */
  used_phase2: number;
  available: number;
  recent: Array<{
    code: string;
    ip_address: string | null;
    used_at: string;
  }>;
}

export interface PaginatedCodes {
  codes: Code[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EmailRedemptionRow {
  id: number;
  email: string;
  redeemed_at: string;
  prize_code: string;
  prize_link: string;
}

export interface PaginatedEmailRedemptions {
  items: EmailRedemptionRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface RedeemRequest {
  code: string;
  captchaToken: string;
}

export interface RequestVerificationRequest {
  email: string;
  captchaToken?: string;
}

export interface RedeemInfluencerRequest {
  email: string;
  verificationCode: string;
}

export interface RedeemResponse {
  success?: boolean;
  link?: string;
  error?: string;
  message?: string;
  email?: string;
  expiresAt?: string;
}

export interface SettingsData {
  start_date: string;
  end_date: string;
}

export interface CsvUploadRequest {
  csvData: string;
}

export interface CsvUploadResponse {
  success: boolean;
  jobId: string;
  message: string;
  totalLines: number;
}

export interface ImportStatusResponse {
  jobId: string;
  status: string;
  progress: number;
  totalLines: number;
  processedLines: number;
  successfulLines: number;
  failedLines: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EmailRedemption {
  id: number;
  email: string;
  code_id: number;
  redeemed_at: string;
}

export interface VerificationCode {
  email: string;
  verification_code: string;
  expires_at: string;
  attempts: number;
  created_at?: string;
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
