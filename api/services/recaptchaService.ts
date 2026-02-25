/**
 * Verifica token de verificação humana usando apenas Cloudflare Turnstile.
 *
 * Se nenhuma chave estiver configurada, a verificação é ignorada (dev/teste).
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token: string, userIp?: string): Promise<boolean> {
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY?.trim() ||
    process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secretKey) return true;
  if (!token) return false;

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(userIp && { remoteip: userIp }),
    });

    const res = await fetch(TURNSTILE_VERIFY_URL, {
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

// ─── Função principal (exportada) ────────────────────────────
export async function verifyRecaptcha(token: string, userIp?: string): Promise<boolean> {
  return verifyTurnstile(token, userIp);
}
