/**
 * EmailService - Sends admin login codes via Resend or logs in dev
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.druidtickets_RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || process.env.druidtickets_RESEND_FROM || 'Admin <onboarding@resend.dev>';

export class EmailService {
  private resend: Resend | null = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

  // Sends login code to email; in dev without API key, logs code to console
  async sendLoginCode(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
    const subject = 'Seu código de acesso ao painel';
    const text = `Seu código de acesso ao painel é: ${code}. Válido por 15 minutos.`;

    if (!this.resend) {
      console.log('[EmailService] RESEND_API_KEY not set – login code for', email, ':', code);
      return { ok: true };
    }

    try {
      const { error } = await this.resend.emails.send({
        from: RESEND_FROM,
        to: [email],
        subject,
        html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
      });
      if (error) {
        console.error('[EmailService] Resend error:', error);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[EmailService] Send failed:', message);
      return { ok: false, error: message };
    }
  }
}
