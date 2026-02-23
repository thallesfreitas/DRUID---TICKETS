/**
 * Hook para reCAPTCHA Enterprise (invisível, score-based)
 * Carrega enterprise.js e executa automaticamente no submit
 */

import { useState, useEffect, useCallback } from 'react';

const SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';
const RECAPTCHA_ACTION = 'redeem';

export function useRecaptchaEnterprise() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) return;

    if (window.grecaptcha?.enterprise) {
      window.grecaptcha.enterprise.ready(() => setReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.onload = () => {
      window.grecaptcha?.enterprise?.ready(() => setReady(true));
    };
    document.head.appendChild(script);
  }, []);

  /** Executa reCAPTCHA e retorna token (chamar no submit) */
  const executeRecaptcha = useCallback(async (): Promise<string> => {
    if (!ready || !window.grecaptcha?.enterprise || !SITE_KEY) return '';
    try {
      return await window.grecaptcha.enterprise.execute(SITE_KEY, { action: RECAPTCHA_ACTION });
    } catch (err) {
      console.error('[reCAPTCHA Enterprise] execute error:', err);
      return '';
    }
  }, [ready]);

  return { ready, executeRecaptcha, siteKey: SITE_KEY };
}
