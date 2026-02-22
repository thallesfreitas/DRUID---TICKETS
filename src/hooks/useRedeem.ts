/**
 * useRedeem - Custom hook para lógica de resgate de código
 */

import { useState, useCallback, useEffect } from 'react';
import { PublicService } from '../services/api/public';
import { apiClient } from '../services/api/client';
import { Settings, RedeemResult } from '../types/api';
import { useFetch } from './useFetch';

const publicService = new PublicService(apiClient);

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

export function useRedeem(): UseRedeemState {
  const [code, setCode] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [successData, setSuccessData] = useState<RedeemResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings
  const { data: settings, loading: settingsLoading } = useFetch(
    () => publicService.getSettings(),
    []
  );

  const handleRedeem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const result = await publicService.redeem(code, captchaVerified ? 'mock-token' : '');
      setSuccessData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      setError(message);
      setCaptchaVerified(false);
    } finally {
      setLoading(false);
    }
  }, [code, captchaVerified]);

  const resetSuccess = useCallback(() => {
    setSuccessData(null);
    setCode('');
    setCaptchaVerified(false);
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
