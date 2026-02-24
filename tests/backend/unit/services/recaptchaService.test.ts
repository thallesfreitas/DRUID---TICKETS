/**
 * Unit tests for captcha verification service (Turnstile v2 + reCAPTCHA Enterprise)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verifyRecaptcha } from '@/api/services/recaptchaService';

const mockCreateAssessment = vi.fn();
vi.mock('@google-cloud/recaptcha-enterprise', () => ({
  RecaptchaEnterpriseServiceClient: class MockClient {
    projectPath(projectId: string) {
      return `projects/${projectId}`;
    }
    createAssessment = mockCreateAssessment;
  },
}));

describe('recaptchaService', () => {
  const originalMode = process.env.RECAPTCHA_MODE;
  const originalSecret = process.env.RECAPTCHA_SECRET_KEY;
  const originalProjectId = process.env.RECAPTCHA_PROJECT_ID;
  const originalSiteKey = process.env.RECAPTCHA_SITE_KEY;

  afterEach(() => {
    process.env.RECAPTCHA_MODE = originalMode;
    process.env.RECAPTCHA_SECRET_KEY = originalSecret;
    process.env.RECAPTCHA_PROJECT_ID = originalProjectId;
    process.env.RECAPTCHA_SITE_KEY = originalSiteKey;
    vi.clearAllMocks();
  });

  describe('Turnstile (mode v2)', () => {
    beforeEach(() => {
      process.env.RECAPTCHA_MODE = 'v2';
    });

    it('should return true when secret is not set (bypass)', async () => {
      delete process.env.RECAPTCHA_SECRET_KEY;
      const result = await verifyRecaptcha('any-token');
      expect(result).toBe(true);
    });

    it('should return false when token is empty', async () => {
      process.env.RECAPTCHA_SECRET_KEY = 'turnstile-secret';
      const result = await verifyRecaptcha('');
      expect(result).toBe(false);
    });

    it('should return true when Turnstile siteverify returns success', async () => {
      process.env.RECAPTCHA_SECRET_KEY = 'turnstile-secret';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: true }) })
      );
      const result = await verifyRecaptcha('turnstile-token');
      expect(result).toBe(true);
      vi.unstubAllGlobals();
    });

    it('should return false when Turnstile siteverify returns success: false', async () => {
      process.env.RECAPTCHA_SECRET_KEY = 'turnstile-secret';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: false }) })
      );
      const result = await verifyRecaptcha('bad-token');
      expect(result).toBe(false);
      vi.unstubAllGlobals();
    });
  });

  describe('reCAPTCHA Enterprise', () => {
    beforeEach(() => {
      process.env.RECAPTCHA_MODE = 'enterprise';
      process.env.RECAPTCHA_PROJECT_ID = 'test-project';
      process.env.RECAPTCHA_SITE_KEY = 'test-site-key';
    });

    it('should return true (bypass) when project ID or site key is missing', async () => {
      delete process.env.RECAPTCHA_PROJECT_ID;
      delete process.env.RECAPTCHA_SITE_KEY;
      const result = await verifyRecaptcha('any-token');
      expect(result).toBe(true);
      expect(mockCreateAssessment).not.toHaveBeenCalled();
    });

    it('should return true when assessment is valid, action matches, score >= 0.5', async () => {
      mockCreateAssessment.mockResolvedValue([
        {
          tokenProperties: { valid: true, action: 'redeem' },
          riskAnalysis: { score: 0.8 },
        },
      ]);
      const result = await verifyRecaptcha('token');
      expect(result).toBe(true);
      expect(mockCreateAssessment).toHaveBeenCalled();
    });

    it('should return false when token is invalid', async () => {
      mockCreateAssessment.mockResolvedValue([
        { tokenProperties: { valid: false }, riskAnalysis: {} },
      ]);
      const result = await verifyRecaptcha('token');
      expect(result).toBe(false);
    });

    it('should return false when action does not match', async () => {
      mockCreateAssessment.mockResolvedValue([
        {
          tokenProperties: { valid: true, action: 'other' },
          riskAnalysis: { score: 0.9 },
        },
      ]);
      const result = await verifyRecaptcha('token');
      expect(result).toBe(false);
    });

    it('should return false when score is below threshold', async () => {
      mockCreateAssessment.mockResolvedValue([
        {
          tokenProperties: { valid: true, action: 'redeem' },
          riskAnalysis: { score: 0.2 },
        },
      ]);
      const result = await verifyRecaptcha('token');
      expect(result).toBe(false);
    });

    it('should return false when createAssessment throws', async () => {
      mockCreateAssessment.mockRejectedValue(new Error('API error'));
      const result = await verifyRecaptcha('token');
      expect(result).toBe(false);
    });
  });
});
