/**
 * Verifica token de verificação humana.
 *
 * Modos (definido por RECAPTCHA_MODE no .env):
 *   "v2"         → verifica via Cloudflare Turnstile siteverify
 *   "enterprise" → verifica via Google Cloud reCAPTCHA Enterprise
 *
 * Se nenhuma chave estiver configurada, a verificação é ignorada (dev/teste).
 */

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

// ─── Configuração ────────────────────────────────────────────
const RECAPTCHA_ACTION = 'redeem';
const ENTERPRISE_MIN_SCORE = 0.5;

function getRecaptchaMode(): string {
  return (process.env.RECAPTCHA_MODE || 'v2').toLowerCase();
}

// ─── Enterprise client (lazy) ────────────────────────────────
let enterpriseClient: RecaptchaEnterpriseServiceClient | null = null;
let enterpriseClientFailed = false;

function getEnterpriseClient(): RecaptchaEnterpriseServiceClient | null {
  if (enterpriseClientFailed) return null;
  if (enterpriseClient) return enterpriseClient;
  try {
    enterpriseClient = new RecaptchaEnterpriseServiceClient();
    return enterpriseClient;
  } catch (err) {
    enterpriseClientFailed = true;
    console.warn(
      '[reCAPTCHA Enterprise] Client not available (credentials file missing or invalid). Verification will be skipped.',
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// ─── Turnstile siteverify (modo v2) ────────────────────────────
async function verifyTurnstile(token: string, userIp?: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secretKey) return true;
  if (!token) return false;

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(userIp && { remoteip: userIp }),
    });

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    return data.success === true;
  } catch (err) {
    console.error('[Turnstile] verification error:', err);
    return false;
  }
}

// ─── Enterprise createAssessment ─────────────────────────────
function isCredentialsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /does not exist|not a file|credentials|GOOGLE_APPLICATION_CREDENTIALS/i.test(msg) ||
    (err as NodeJS.ErrnoException)?.code === 'ENOENT'
  );
}

async function verifyEnterprise(token: string, userIp?: string): Promise<boolean> {
  const projectId = process.env.RECAPTCHA_PROJECT_ID?.trim();
  const siteKey = process.env.RECAPTCHA_SITE_KEY?.trim();
  console.log('[reCAPTCHA DEBUG] projectId:', projectId, '| siteKey:', siteKey?.slice(0, 10) + '...');
  if (!projectId || !siteKey) return true;

  console.log('[reCAPTCHA DEBUG] token length:', token?.length, '| token empty:', !token);
  if (!token) return false;

  const client = getEnterpriseClient();
  if (!client) return true;

  try {
    const projectPath = client.projectPath(projectId);

    const [response] = await client.createAssessment({
      parent: projectPath,
      assessment: {
        event: {
          token,
          siteKey,
          ...(userIp && { userIpAddress: userIp }),
          expectedAction: RECAPTCHA_ACTION,
        },
      },
    });

    const tokenProps = response.tokenProperties;
    console.log('[reCAPTCHA DEBUG] tokenProps.valid:', tokenProps?.valid, '| action:', tokenProps?.action, '| expected:', RECAPTCHA_ACTION);
    if (!tokenProps?.valid) {
      console.log('[reCAPTCHA DEBUG] invalidReason:', tokenProps?.invalidReason);
      return false;
    }
    if (tokenProps.action !== RECAPTCHA_ACTION) return false;

    const score = response.riskAnalysis?.score ?? 0;
    console.log('[reCAPTCHA DEBUG] score:', score, '| min:', ENTERPRISE_MIN_SCORE);
    return score >= ENTERPRISE_MIN_SCORE;
  } catch (err) {
    if (isCredentialsError(err)) {
      enterpriseClientFailed = true;
      enterpriseClient = null;
      console.warn(
        '[reCAPTCHA Enterprise] Credentials unavailable (e.g. file not mounted in Docker). Verification skipped.',
        err instanceof Error ? err.message : err
      );
      return true;
    }
    console.error('[reCAPTCHA Enterprise] verification error:', err);
    return false;
  }
}

// ─── Função principal (exportada) ────────────────────────────
export async function verifyRecaptcha(token: string, userIp?: string): Promise<boolean> {
  if (getRecaptchaMode() === 'enterprise') {
    return verifyEnterprise(token, userIp);
  }
  return verifyTurnstile(token, userIp);
}
