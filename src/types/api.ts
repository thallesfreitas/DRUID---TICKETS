/**
 * Tipos e interfaces do Frontend
 */

export type ViewType = 'redeem' | 'admin' | 'help' | 'privacy' | 'terms';
export type AdminSubViewType = 'stats' | 'email_redemptions' | 'codes';

export interface Settings {
  start_date: string;
  end_date: string;
}

export interface CodeItem {
  id: number;
  code: string;
  link: string;
  is_used: boolean;
  used_at: string | null;
  ip_address: string | null;
  redeemed_by_email?: boolean;
  redeemed_email?: string | null;
  redeemed_at?: string | null;
}

export interface Stats {
  total: number;
  used: number;
  used_phase1: number;
  used_phase2: number;
  available: number;
  recent: CodeItem[];
}

export interface PaginatedCodes {
  codes: CodeItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EmailRedemptionItem {
  id: number;
  email: string;
  redeemed_at: string;
  prize_code: string;
  prize_link: string;
}

export interface PaginatedEmailRedemptions {
  items: EmailRedemptionItem[];
  total: number;
  page: number;
  totalPages: number;
}

export type RedeemStep = 'identify' | 'verify';

export interface VerificationRequestResult {
  success?: boolean;
  message?: string;
  email?: string;
  expiresAt?: string;
}

export interface RedeemResult {
  success?: boolean;
  link?: string;
  error?: string;
  message?: string;
  email?: string;
  expiresAt?: string;
}

export interface CsvUploadResponse {
  success: boolean;
  jobId: string;
  message: string;
  totalLines: number;
}

export interface ImportStatusResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed' | 'pending';
  progress: number;
  totalLines: number;
  processedLines: number;
  successfulLines: number;
  failedLines: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
