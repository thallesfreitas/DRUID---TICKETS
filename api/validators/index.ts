/**
 * Validadores de input usando Zod
 */

import { z } from 'zod';

export const RedeemSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  captchaToken: z.string().min(1, 'reCAPTCHA é obrigatório'),
});

export const CsvUploadSchema = z.object({
  csvData: z.string().min(1, 'CSV não pode estar vazio'),
});

export const SettingsSchema = z.object({
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
});

export const AdminLoginSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type RedeemRequest = z.infer<typeof RedeemSchema>;
export type CsvUploadRequest = z.infer<typeof CsvUploadSchema>;
export type SettingsRequest = z.infer<typeof SettingsSchema>;
export type AdminLoginRequest = z.infer<typeof AdminLoginSchema>;

/**
 * Validação de linha de CSV
 */
export function validateCsvLine(line: string): { code: string; link: string } | null {
  const parts = line.split(',').map(s => s.trim());
  const [code, link] = parts;

  if (!code || !link) {
    return null;
  }

  return {
    code: code.toUpperCase(),
    link,
  };
}

/**
 * Validar múltiplas linhas CSV
 */
export function validateCsvLines(lines: string[]): { code: string; link: string }[] {
  return lines
    .map(line => validateCsvLine(line))
    .filter((item): item is { code: string; link: string } => item !== null);
}
