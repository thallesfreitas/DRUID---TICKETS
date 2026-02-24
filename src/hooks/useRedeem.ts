/**
 * useRedeem - Lógica de resgate de código. Obtém token reCAPTCHA no submit via getCaptchaToken.
 */

import { useState, useCallback } from 'react';
import { PublicService } from '../services/api/public';
import { apiClient } from '../services/api/client';
import { Settings, RedeemResult } from '../types/api';
import { useFetch } from './useFetch';

const publicService = new PublicService(apiClient);

export type GetCaptchaToken = () => Promise<string>;

export interface UseRedeemOptions {
  getCaptchaToken?: GetCaptchaToken;
}

export interface UseRedeemState {
  code: string;
  setCode: (code: string) => void;
  captchaVerified: boolean;
  setCaptchaVerified: (verified: boolean) => void;
  settings: Settings | null;
  settingsLoading: boolean;
  successData: RedeemResult | null;
  loading: boolean;
  error: string | null;
  handleRedeem: (e: React.FormEvent) => Promise<void>;
  resetSuccess: () => void;
}

export function useRedeem(options: UseRedeemOptions = {}): UseRedeemState {
  const { getCaptchaToken } = options;
  const [code, setCode] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(true);
  const [successData, setSuccessData] = useState<RedeemResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: settings, loading: settingsLoading } = useFetch(
    () => publicService.getSettings(),
    []
  );

  const handleRedeem = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!code) return;

      const tokenFn = getCaptchaToken ?? (() => Promise.resolve(''));
      setLoading(true);
      setError(null);

      try {
        const token = await tokenFn();
        const result = await publicService.redeem(code, token);
        setSuccessData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
        setError(message);
        setCaptchaVerified(false);
      } finally {
        setLoading(false);
      }
    },
    [code, getCaptchaToken]
  );

  const resetSuccess = useCallback(() => {
    setSuccessData(null);
    setCode('');
    setCaptchaVerified(true);
  }, []);

  return {
    code,
    setCode: (newCode) => setCode(newCode.toUpperCase()),
    captchaVerified,
    setCaptchaVerified,
    settings,
    settingsLoading,
    successData,
    loading,
    error,
    handleRedeem,
    resetSuccess,
  };
}
