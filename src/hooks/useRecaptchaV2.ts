/**
 * Hook que agora usa Cloudflare Turnstile (substitui o reCAPTCHA v2).
 * Continua expondo a mesma interface para o restante da aplicação.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark';
        }
      ) => string | number;
      reset: (widgetId?: string | number) => void;
    };
  }
}

// Usa chaves específicas do Turnstile, com fallback para nomes antigos de reCAPTCHA.
const SITE_KEY = process.env.TURNSTILE_SITE_KEY || process.env.RECAPTCHA_SITE_KEY || '';

export function useRecaptchaV2() {
  const [token, setToken] = useState<string>('');
  const [ready, setReady] = useState(false);
  const widgetIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;

    if (window.turnstile) {
      setReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setReady(true);
    };
    document.head.appendChild(script);
  }, []);

  const renderWidget = useCallback(
    (containerId: string) => {
      if (!ready || !window.turnstile || widgetIdRef.current !== null) return;

      const container =
        typeof document !== 'undefined'
          ? document.getElementById(containerId)
          : null;

      if (!container) return;

      try {
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: SITE_KEY,
          callback: (t: string) => setToken(t),
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
          theme: 'light',
        });
      } catch (err) {
        console.error('Turnstile render error:', err);
      }
    },
    [ready]
  );

  const resetWidget = useCallback(() => {
    if (window.turnstile && widgetIdRef.current !== null) {
      window.turnstile.reset(widgetIdRef.current);
      setToken('');
    }
  }, []);

  return { token, ready, renderWidget, resetWidget, siteKey: SITE_KEY };
}
