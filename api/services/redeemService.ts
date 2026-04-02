/**
 * RedeemService - Lógica de resgate público
 */

import { DatabaseClient } from '../database/client.js';
import { RedeemResponse, AppError, EmailRedemption, VerificationCode } from '../types/index.js';
import { API_DEFAULTS, ERROR_CODES, HTTP_STATUS } from '../constants/api.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/messages.js';
import { CodeService } from './codeService.js';
import { SettingsService } from './settingsService.js';
import { BruteForceService } from './bruteForceService.js';
import { EmailService } from './emailService.js';

const DEFAULT_PROMO_CODE = 'BKCLASHPROMO2026';

interface ClaimedCodeRow {
  id: number;
  link: string;
}

export class RedeemService {
  constructor(
    private codeService: CodeService,
    private settingsService: SettingsService,
    private bruteForceService: BruteForceService,
    private db?: DatabaseClient,
    private emailService?: EmailService
  ) {}

  /**
   * Fluxo legado de resgate por código único
   */
  async redeem(code: string, ip: string): Promise<RedeemResponse> {
    await this.ensurePromotionActive();

    const codeRecord = await this.codeService.getByCode(code);

    if (!codeRecord) {
      await this.bruteForceService.recordFailedAttempt(ip);

      throw new AppError(
        ERROR_MESSAGES.INVALID_CODE,
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.INVALID_CODE
      );
    }

    if (codeRecord.is_used) {
      throw new AppError(
        ERROR_MESSAGES.CODE_USED,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.CODE_USED
      );
    }

    await this.codeService.markAsUsed(codeRecord.id, ip);
    await this.bruteForceService.clearAttempts(ip);

    return {
      success: true,
      link: codeRecord.link,
    };
  }

  /**
   * Solicita OTP para validar posse do e-mail
   */
  async requestVerification(promoCode: string, email: string): Promise<RedeemResponse> {
    await this.ensurePromotionActive();
    this.ensureDependencies();

    const normalizedPromoCode = promoCode.trim().toUpperCase();
    const normalizedEmail = normalizeEmail(email);

    if (normalizedPromoCode !== this.getConfiguredPromoCode()) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_PROMO_CODE,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_PROMO_CODE
      );
    }

    const existingRedemption = await this.db!.execute<EmailRedemption>({
      sql: 'SELECT id, email, code_id, redeemed_at FROM email_redemptions WHERE email = $1 LIMIT 1',
      args: [normalizedEmail],
    });

    if (existingRedemption[0]) {
      throw new AppError(
        ERROR_MESSAGES.EMAIL_ALREADY_REDEEMED,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.EMAIL_ALREADY_REDEEMED
      );
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + API_DEFAULTS.VERIFICATION_CODE_EXPIRY_MIN * 60 * 1000);

    await this.db!.execute({
      sql: `INSERT INTO verification_codes (email, verification_code, expires_at, attempts, created_at)
            VALUES ($1, $2, $3, 0, NOW())
            ON CONFLICT (email) DO UPDATE SET
              verification_code = EXCLUDED.verification_code,
              expires_at = EXCLUDED.expires_at,
              attempts = 0,
              created_at = NOW()`,
      args: [normalizedEmail, verificationCode, expiresAt.toISOString()],
    });

    const sendResult = await this.emailService!.sendVerificationCode(normalizedEmail, verificationCode);

    if (!sendResult.ok) {
      await this.db!.execute({
        sql: 'DELETE FROM verification_codes WHERE email = $1',
        args: [normalizedEmail],
      });

      throw new AppError(
        ERROR_MESSAGES.VERIFICATION_EMAIL_FAILED,
        HTTP_STATUS.INTERNAL_ERROR,
        ERROR_CODES.VERIFICATION_EMAIL_FAILED
      );
    }

    return {
      success: true,
      message: SUCCESS_MESSAGES.VERIFICATION_SENT,
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Resgata um prêmio aleatório após validar o OTP enviado ao e-mail
   */
  async redeemInfluencer(email: string, verificationCode: string, ip: string): Promise<RedeemResponse> {
    await this.ensurePromotionActive();
    this.ensureDependencies();

    const normalizedEmail = normalizeEmail(email);
    const normalizedVerificationCode = verificationCode.trim();

    const result = await this.db!.withTransaction<RedeemResponse>(async (tx) => {
      const verificationRows = await tx.execute<VerificationCode>({
        sql: `SELECT email, verification_code, expires_at, attempts
              FROM verification_codes
              WHERE email = $1
              FOR UPDATE`,
        args: [normalizedEmail],
      });

      const verificationRow = verificationRows[0];

      if (!verificationRow) {
        throw new AppError(
          ERROR_MESSAGES.INVALID_VERIFICATION_CODE,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.INVALID_VERIFICATION_CODE
        );
      }

      if (new Date(verificationRow.expires_at) < new Date()) {
        await tx.execute({
          sql: 'DELETE FROM verification_codes WHERE email = $1',
          args: [normalizedEmail],
        });

        throw new AppError(
          ERROR_MESSAGES.VERIFICATION_CODE_EXPIRED,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.VERIFICATION_CODE_EXPIRED
        );
      }

      if (verificationRow.attempts >= API_DEFAULTS.VERIFICATION_CODE_MAX_ATTEMPTS) {
        throw new AppError(
          ERROR_MESSAGES.VERIFICATION_CODE_BLOCKED,
          HTTP_STATUS.RATE_LIMIT,
          ERROR_CODES.VERIFICATION_CODE_BLOCKED
        );
      }

      if (verificationRow.verification_code !== normalizedVerificationCode) {
        const nextAttempts = verificationRow.attempts + 1;

        await tx.execute({
          sql: 'UPDATE verification_codes SET attempts = $2 WHERE email = $1',
          args: [normalizedEmail, nextAttempts],
        });

        if (nextAttempts >= API_DEFAULTS.VERIFICATION_CODE_MAX_ATTEMPTS) {
          throw new AppError(
            ERROR_MESSAGES.VERIFICATION_CODE_BLOCKED,
            HTTP_STATUS.RATE_LIMIT,
            ERROR_CODES.VERIFICATION_CODE_BLOCKED
          );
        }

        throw new AppError(
          ERROR_MESSAGES.INVALID_VERIFICATION_CODE,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.INVALID_VERIFICATION_CODE
        );
      }

      const existingRedemption = await tx.execute<EmailRedemption>({
        sql: 'SELECT id, email, code_id, redeemed_at FROM email_redemptions WHERE email = $1 LIMIT 1',
        args: [normalizedEmail],
      });

      if (existingRedemption[0]) {
        throw new AppError(
          ERROR_MESSAGES.EMAIL_ALREADY_REDEEMED,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.EMAIL_ALREADY_REDEEMED
        );
      }

      const claimedCodeRows = await tx.execute<ClaimedCodeRow>({
        sql: `WITH picked_code AS (
                SELECT id, link
                FROM codes
                WHERE is_used = false
                ORDER BY RANDOM()
                LIMIT 1
                FOR UPDATE SKIP LOCKED
              )
              UPDATE codes AS c
              SET is_used = true,
                  used_at = NOW(),
                  ip_address = $1
              FROM picked_code
              WHERE c.id = picked_code.id
              RETURNING c.id, c.link`,
        args: [ip],
      });

      const claimedCode = claimedCodeRows[0];

      if (!claimedCode) {
        throw new AppError(
          ERROR_MESSAGES.NO_CODES_AVAILABLE,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.NO_CODES_AVAILABLE
        );
      }

      await tx.execute({
        sql: 'INSERT INTO email_redemptions (email, code_id, redeemed_at) VALUES ($1, $2, NOW())',
        args: [normalizedEmail, claimedCode.id],
      });

      await tx.execute({
        sql: 'DELETE FROM verification_codes WHERE email = $1',
        args: [normalizedEmail],
      });

      return {
        success: true,
        link: claimedCode.link,
      };
    });

    await this.bruteForceService.clearAttempts(ip);

    return result;
  }

  private async ensurePromotionActive(): Promise<void> {
    const isStarted = await this.settingsService.isStarted();
    if (!isStarted) {
      throw new AppError(
        ERROR_MESSAGES.PROMO_NOT_STARTED,
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.PROMO_NOT_STARTED
      );
    }

    const isEnded = await this.settingsService.isEnded();
    if (isEnded) {
      throw new AppError(
        ERROR_MESSAGES.PROMO_ENDED,
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.PROMO_ENDED
      );
    }
  }

  private ensureDependencies(): void {
    if (!this.db || !this.emailService) {
      throw new Error('RedeemService requires DatabaseClient and EmailService for OTP redemption.');
    }
  }

  private getConfiguredPromoCode(): string {
    return (process.env.PROMO_FIXED_CODE || DEFAULT_PROMO_CODE).trim().toUpperCase();
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
