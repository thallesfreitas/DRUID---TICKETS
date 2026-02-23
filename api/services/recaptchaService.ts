/**
 * Verifica token reCAPTCHA.
 *
 * Modos (definido por RECAPTCHA_MODE no .env):
 *   "v2"         → verifica via siteverify (simples, checkbox)
 *   "enterprise" → verifica via Google Cloud reCAPTCHA Enterprise
 *
 * Se nenhuma chave estiver configurada, a verificação é ignorada (dev/teste).
 */

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

// ─── Configuração ────────────────────────────────────────────
const RECAPTCHA_MODE = (process.env.RECAPTCHA_MODE || 'v2').toLowerCase();
const RECAPTCHA_ACTION = 'redeem';
const ENTERPRISE_MIN_SCORE = 0.5;

// ─── Enterprise client (lazy) ────────────────────────────────
let enterpriseClient: RecaptchaEnterpriseServiceClient | null = null;
function getEnterpriseClient(): RecaptchaEnterpriseServiceClient {
  if (!enterpriseClient) {
    enterpriseClient = new RecaptchaEnterpriseServiceClient();
  }
  return enterpriseClient;
}

// ─── v2 siteverify ───────────────────────────────────────────
async function verifyV2(token: string, userIp?: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secretKey) return true;
  if (!token) return false;

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(userIp && { remoteip: userIp }),
    });

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('[reCAPTCHA v2] verification error:', err);
    return false;
  }
}

// ─── Enterprise createAssessment ─────────────────────────────
async function verifyEnterprise(token: string, userIp?: string): Promise<boolean> {
  const projectId = process.env.RECAPTCHA_PROJECT_ID?.trim();
  const siteKey = process.env.RECAPTCHA_SITE_KEY?.trim();
  if (!projectId || !siteKey) return true;
  if (!token) return false;

  try {
    const client = getEnterpriseClient();
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
    if (!tokenProps?.valid) return false;
    if (tokenProps.action !== RECAPTCHA_ACTION) return false;

    const score = response.riskAnalysis?.score ?? 0;
    return score >= ENTERPRISE_MIN_SCORE;
  } catch (err) {
    console.error('[reCAPTCHA Enterprise] verification error:', err);
    return false;
  }
}

// ─── Função principal (exportada) ────────────────────────────
export async function verifyRecaptcha(token: string, userIp?: string): Promise<boolean> {
  if (RECAPTCHA_MODE === 'enterprise') {
    return verifyEnterprise(token, userIp);
  }
  return verifyV2(token, userIp);
}
