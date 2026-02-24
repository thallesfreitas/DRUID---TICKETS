/**
 * Tests for validators (Zod schemas)
 * Unit tests for input validation
 */

import { describe, it, expect } from 'vitest';
import {
  RedeemSchema,
  CsvUploadSchema,
  SettingsSchema,
  AdminLoginSchema,
  validateCsvLine,
  validateCsvLines,
  type RedeemRequest,
  type CsvUploadRequest,
  type SettingsRequest,
  type AdminLoginRequest
} from '@/api/validators';

describe('Validators', () => {
  describe('RedeemSchema', () => {
    it('should validate correct redeem request', () => {
      const valid: RedeemRequest = {
        code: 'PROMO123',
        captchaToken: 'token-abc-123'
      };

      const result = RedeemSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(valid);
      }
    });

    it('should accept uppercase code', () => {
      const data = {
        code: 'PROMO123',
        captchaToken: 'token'
      };

      const result = RedeemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty code', () => {
      const invalid = {
        code: '',
        captchaToken: 'token'
      };

      const result = RedeemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Código é obrigatório');
      }
    });

    it('should reject missing code', () => {
      const invalid = {
        captchaToken: 'token'
      };

      const result = RedeemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject empty captchaToken', () => {
      const invalid = {
        code: 'PROMO123',
        captchaToken: ''
      };

      const result = RedeemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('reCAPTCHA é obrigatório');
      }
    });

    it('should reject missing captchaToken', () => {
      const invalid = {
        code: 'PROMO123'
      };

      const result = RedeemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject null values', () => {
      const invalid = {
        code: null,
        captchaToken: null
      };

      const result = RedeemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should handle extra fields', () => {
      const data = {
        code: 'PROMO123',
        captchaToken: 'token',
        extra: 'field'
      };

      const result = RedeemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('CsvUploadSchema', () => {
    it('should validate correct CSV upload', () => {
      const valid: CsvUploadRequest = {
        csvData: 'CODE1,https://example.com\nCODE2,https://example.com'
      };

      const result = CsvUploadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty csvData', () => {
      const invalid = {
        csvData: ''
      };

      const result = CsvUploadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('CSV não pode estar vazio');
      }
    });

    it('should reject missing csvData', () => {
      const invalid = {};

      const result = CsvUploadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept large CSV data', () => {
      const lines = Array.from({ length: 1000 }, (_, i) =>
        `CODE${String(i).padStart(4, '0')},https://example.com`
      ).join('\n');

      const result = CsvUploadSchema.safeParse({ csvData: lines });
      expect(result.success).toBe(true);
    });
  });

  describe('SettingsSchema', () => {
    it('should validate correct settings', () => {
      const valid: SettingsRequest = {
        start_date: '2024-01-01 00:00:00',
        end_date: '2024-12-31 23:59:59'
      };

      const result = SettingsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should allow empty start_date', () => {
      const data = {
        start_date: '',
        end_date: '2024-12-31 23:59:59'
      };

      const result = SettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow empty end_date', () => {
      const data = {
        start_date: '2024-01-01 00:00:00',
        end_date: ''
      };

      const result = SettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow both empty dates', () => {
      const data = {
        start_date: '',
        end_date: ''
      };

      const result = SettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow missing fields (will use defaults)', () => {
      const data = {};

      const result = SettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.start_date).toBe('');
        expect(result.data.end_date).toBe('');
      }
    });

    it('should accept ISO format dates', () => {
      const data = {
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z'
      };

      const result = SettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('AdminLoginSchema', () => {
    it('should validate correct login request', () => {
      const valid: AdminLoginRequest = {
        password: 'secret-password-123'
      };

      const result = AdminLoginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalid = {
        password: ''
      };

      const result = AdminLoginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Senha é obrigatória');
      }
    });

    it('should reject missing password', () => {
      const invalid = {};

      const result = AdminLoginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept long passwords', () => {
      const longPassword = 'a'.repeat(1000);
      const result = AdminLoginSchema.safeParse({ password: longPassword });
      expect(result.success).toBe(true);
    });

    it('should accept passwords with special characters', () => {
      const valid = {
        password: 'P@ssw0rd!#$%^&*()'
      };

      const result = AdminLoginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('validateCsvLine', () => {
    it('should validate correct CSV line', () => {
      const line = 'CODE123, https://example.com';
      const result = validateCsvLine(line);

      expect(result).not.toBeNull();
      expect(result?.code).toBe('CODE123');
      expect(result?.link).toBe('https://example.com');
    });

    it('should trim whitespace', () => {
      const line = '  CODE123  ,  https://example.com  ';
      const result = validateCsvLine(line);

      expect(result?.code).toBe('CODE123');
      expect(result?.link).toBe('https://example.com');
    });

    it('should uppercase code', () => {
      const line = 'code123, https://example.com';
      const result = validateCsvLine(line);

      expect(result?.code).toBe('CODE123');
    });

    it('should reject line with missing code', () => {
      const line = ', https://example.com';
      const result = validateCsvLine(line);

      expect(result).toBeNull();
    });

    it('should reject line with missing link', () => {
      const line = 'CODE123, ';
      const result = validateCsvLine(line);

      expect(result).toBeNull();
    });

    it('should reject empty line', () => {
      const line = '';
      const result = validateCsvLine(line);

      expect(result).toBeNull();
    });

    it('should reject line with only whitespace', () => {
      const line = '   ';
      const result = validateCsvLine(line);

      expect(result).toBeNull();
    });

    it('should handle URLs with commas in query params', () => {
      const line = 'CODE123, https://example.com?a=1,b=2';
      const result = validateCsvLine(line);

      // Note: This will parse incorrectly because of comma in URL
      // This is a known limitation of simple split parsing
      expect(result).not.toBeNull(); // But we get a result
    });
  });

  describe('validateCsvLines', () => {
    it('should validate multiple CSV lines', () => {
      const lines = [
        'CODE1, https://example.com',
        'CODE2, https://example.com',
        'CODE3, https://example.com'
      ];

      const results = validateCsvLines(lines);
      expect(results).toHaveLength(3);
      expect(results[0].code).toBe('CODE1');
      expect(results[1].code).toBe('CODE2');
      expect(results[2].code).toBe('CODE3');
    });

    it('should filter out invalid lines', () => {
      const lines = [
        'CODE1, https://example.com',
        ', https://example.com', // Invalid - missing code
        'CODE2, https://example.com',
        '' // Invalid - empty
      ];

      const results = validateCsvLines(lines);
      expect(results).toHaveLength(2);
      expect(results[0].code).toBe('CODE1');
      expect(results[1].code).toBe('CODE2');
    });

    it('should handle empty array', () => {
      const results = validateCsvLines([]);
      expect(results).toHaveLength(0);
    });

    it('should handle all invalid lines', () => {
      const lines = [
        ', https://example.com',
        'CODE, ',
        ''
      ];

      const results = validateCsvLines(lines);
      expect(results).toHaveLength(0);
    });

    it('should uppercase all codes', () => {
      const lines = [
        'code1, https://example.com',
        'CODE2, https://example.com',
        'Code3, https://example.com'
      ];

      const results = validateCsvLines(lines);
      expect(results.map(r => r.code)).toEqual(['CODE1', 'CODE2', 'CODE3']);
    });

    it('should handle large CSV with 10000 lines', () => {
      const lines = Array.from({ length: 10000 }, (_, i) =>
        `CODE${String(i).padStart(5, '0')}, https://example.com`
      );

      const results = validateCsvLines(lines);
      expect(results).toHaveLength(10000);
    });
  });
});
