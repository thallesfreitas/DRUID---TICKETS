/**
 * Hook para reCAPTCHA v2 "Não sou um robô" (checkbox)
 * Carrega api.js e fornece funções para renderizar e obter token
 */

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        ready: (cb: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
      render: (container: string | HTMLElement, params: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
      }) => number;
      reset: (widgetId?: number) => void;
      ready: (cb: () => void) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';

export function useRecaptchaV2() {
  const [token, setToken] = useState<string>('');
  const [ready, setReady] = useState(false);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.grecaptcha?.render) {
      setReady(true);
      return;
    }

    window.onRecaptchaLoad = () => setReady(true);

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => { delete window.onRecaptchaLoad; };
  }, []);

  const renderWidget = useCallback((containerId: string) => {
    if (!ready || !window.grecaptcha || widgetIdRef.current !== null) return;
    try {
      widgetIdRef.current = window.grecaptcha.render(containerId, {
        sitekey: SITE_KEY,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(''),
        theme: 'light',
        size: 'normal',
      });
    } catch (err) {
      console.error('reCAPTCHA v2 render error:', err);
    }
  }, [ready]);

  const resetWidget = useCallback(() => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      window.grecaptcha.reset(widgetIdRef.current);
      setToken('');
    }
  }, []);

  return { token, ready, renderWidget, resetWidget, siteKey: SITE_KEY };
}
