import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RedeemService } from '@/api/services/redeemService';
import { AppError } from '@/api/types';

describe('RedeemService OTP flow', () => {
  const codeService = {
    getByCode: vi.fn(),
    markAsUsed: vi.fn(),
  } as any;

  const settingsService = {
    isStarted: vi.fn().mockResolvedValue(true),
    isEnded: vi.fn().mockResolvedValue(false),
  } as any;

  const bruteForceService = {
    clearAttempts: vi.fn().mockResolvedValue(undefined),
    recordFailedAttempt: vi.fn(),
  } as any;

  const emailService = {
    sendVerificationCode: vi.fn().mockResolvedValue({ ok: true }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores and sends a verification code for a valid email', async () => {
    const db = {
      execute: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
      withTransaction: vi.fn(),
    } as any;

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const service = new RedeemService(codeService, settingsService, bruteForceService, db, emailService);

    const result = await service.requestVerification('OREIDOFOGO', 'Player@Example.com');

    expect(result.success).toBe(true);
    expect(result.email).toBe('player@example.com');
    expect(emailService.sendVerificationCode).toHaveBeenCalledWith('player@example.com', '100000');
    expect(db.execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        args: expect.arrayContaining(['player@example.com', '100000']),
      })
    );

    randomSpy.mockRestore();
  });

  it('claims a random available code after a valid otp', async () => {
    const transactionExecute = vi.fn(async (query: { sql: string }) => {
      if (query.sql.includes('FROM verification_codes')) {
        return [{
          email: 'player@example.com',
          verification_code: '123456',
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          attempts: 0,
        }];
      }

      if (query.sql.includes('FROM email_redemptions')) {
        return [];
      }

      if (query.sql.includes('WITH picked_code')) {
        return [{ id: 7, link: 'https://example.com/prize' }];
      }

      return [];
    });

    const db = {
      execute: vi.fn(),
      withTransaction: vi.fn(async (callback: (tx: { execute: typeof transactionExecute }) => Promise<unknown>) =>
        callback({ execute: transactionExecute })
      ),
    } as any;

    const service = new RedeemService(codeService, settingsService, bruteForceService, db, emailService);

    const result = await service.redeemInfluencer('player@example.com', '123456', '127.0.0.1');

    expect(result).toEqual({ success: true, link: 'https://example.com/prize' });
    expect(bruteForceService.clearAttempts).toHaveBeenCalledWith('127.0.0.1');
  });

  it('increments otp attempts when the provided code is invalid', async () => {
    const transactionExecute = vi.fn(async (query: { sql: string }) => {
      if (query.sql.includes('FROM verification_codes')) {
        return [{
          email: 'player@example.com',
          verification_code: '123456',
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          attempts: 0,
        }];
      }

      if (query.sql.includes('UPDATE verification_codes SET attempts')) {
        return [];
      }

      return [];
    });

    const db = {
      execute: vi.fn(),
      withTransaction: vi.fn(async (callback: (tx: { execute: typeof transactionExecute }) => Promise<unknown>) =>
        callback({ execute: transactionExecute })
      ),
    } as any;

    const service = new RedeemService(codeService, settingsService, bruteForceService, db, emailService);

    await expect(service.redeemInfluencer('player@example.com', '000000', '127.0.0.1')).rejects.toThrow(AppError);

    expect(transactionExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('UPDATE verification_codes SET attempts'),
      })
    );
  });
});
