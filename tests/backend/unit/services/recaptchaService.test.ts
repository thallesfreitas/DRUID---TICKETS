/**
 * Unit tests for captcha verification service (Cloudflare Turnstile only)
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { verifyRecaptcha } from '@/api/services/recaptchaService';

describe('recaptchaService (Turnstile)', () => {
  const originalTurnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const originalRecaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalTurnstileSecret;
    process.env.RECAPTCHA_SECRET_KEY = originalRecaptchaSecret;
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('should return true when no secret is set (bypass dev/teste)', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.RECAPTCHA_SECRET_KEY;

    const result = await verifyRecaptcha('any-token');
    expect(result).toBe(true);
  });

  it('should return false when token is empty and secret is set', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
    const result = await verifyRecaptcha('');
    expect(result).toBe(false);
  });

  it('should return true when Turnstile siteverify returns success', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: true }) })
    );

    const result = await verifyRecaptcha('turnstile-token');
    expect(result).toBe(true);
  });

  it('should return false when Turnstile siteverify returns success: false', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: false }) })
    );

    const result = await verifyRecaptcha('bad-token');
    expect(result).toBe(false);
  });

  it('should return false when Turnstile siteverify throws', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await verifyRecaptcha('any-token');
    expect(result).toBe(false);
  });
});
