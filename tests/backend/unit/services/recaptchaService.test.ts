/**
 * Unit tests for reCAPTCHA Enterprise verification service
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
  const originalProjectId = process.env.RECAPTCHA_PROJECT_ID;
  const originalSiteKey = process.env.RECAPTCHA_SITE_KEY;

  afterEach(() => {
    process.env.RECAPTCHA_PROJECT_ID = originalProjectId;
    process.env.RECAPTCHA_SITE_KEY = originalSiteKey;
    vi.clearAllMocks();
  });

  describe('when RECAPTCHA_PROJECT_ID or RECAPTCHA_SITE_KEY is not set', () => {
    it('should return true (bypass) when both are unset', async () => {
      delete process.env.RECAPTCHA_PROJECT_ID;
      delete process.env.RECAPTCHA_SITE_KEY;
      const result = await verifyRecaptcha('any-token');
      expect(result).toBe(true);
      expect(mockCreateAssessment).not.toHaveBeenCalled();
    });

    it('should return true (bypass) when only project ID is set', async () => {
      process.env.RECAPTCHA_PROJECT_ID = 'my-project';
      delete process.env.RECAPTCHA_SITE_KEY;
      const result = await verifyRecaptcha('any-token');
      expect(result).toBe(true);
      expect(mockCreateAssessment).not.toHaveBeenCalled();
    });

    it('should return true (bypass) when only site key is set', async () => {
      delete process.env.RECAPTCHA_PROJECT_ID;
      process.env.RECAPTCHA_SITE_KEY = 'site-key';
      const result = await verifyRecaptcha('any-token');
      expect(result).toBe(true);
      expect(mockCreateAssessment).not.toHaveBeenCalled();
    });
  });

  describe('when both RECAPTCHA_PROJECT_ID and RECAPTCHA_SITE_KEY are set', () => {
    beforeEach(() => {
      process.env.RECAPTCHA_PROJECT_ID = 'test-project';
      process.env.RECAPTCHA_SITE_KEY = 'test-site-key';
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
      await expect(verifyRecaptcha('token')).rejects.toThrow('API error');
    });
  });
});
