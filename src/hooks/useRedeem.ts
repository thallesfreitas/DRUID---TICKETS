/**
 * useRedeem - Fluxo de resgate com promoCode fixo + OTP por e-mail
 */

import { useState, useCallback } from 'react';
import { PublicService } from '../services/api/public';
import { apiClient } from '../services/api/client';
import { Settings, RedeemResult, RedeemStep } from '../types/api';
import { useFetch } from './useFetch';

const publicService = new PublicService(apiClient);

export type GetCaptchaToken = () => Promise<string>;

export interface UseRedeemOptions {
  getCaptchaToken?: GetCaptchaToken;
  resetCaptcha?: () => void;
}

export interface UseRedeemState {
  step: RedeemStep;
  promoCode: string;
  setPromoCode: (promoCode: string) => void;
  email: string;
  setEmail: (email: string) => void;
  verificationCode: string;
  setVerificationCode: (verificationCode: string) => void;
  verificationEmail: string;
  settings: Settings | null;
  settingsLoading: boolean;
  successData: RedeemResult | null;
  loading: boolean;
  error: string | null;
  handleRequestVerification: (e: React.FormEvent) => Promise<void>;
  handleRedeemPrize: (e: React.FormEvent) => Promise<void>;
  goToIdentifyStep: () => void;
  resetSuccess: () => void;
}

export function useRedeem(options: UseRedeemOptions = {}): UseRedeemState {
  const { getCaptchaToken, resetCaptcha } = options;
  const [step, setStep] = useState<RedeemStep>('identify');
  const [promoCode, setPromoCode] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [successData, setSuccessData] = useState<RedeemResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: settings, loading: settingsLoading } = useFetch(
    () => publicService.getSettings(),
    []
  );

  const handleRequestVerification = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!promoCode.trim() || !email.trim()) return;

      const tokenFn = getCaptchaToken ?? (() => Promise.resolve(''));
      setLoading(true);
      setError(null);

      try {
        const captchaToken = await tokenFn();
        const result = await publicService.requestVerification(promoCode, email, captchaToken);

        setVerificationEmail(result.email || email.trim().toLowerCase());
        setEmail(result.email || email.trim().toLowerCase());
        setVerificationCode('');
        setStep('verify');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
        setError(message);
      } finally {
        resetCaptcha?.();
        setLoading(false);
      }
    },
    [email, getCaptchaToken, promoCode, resetCaptcha]
  );

  const handleRedeemPrize = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!email.trim() || !verificationCode.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const result = await publicService.redeemInfluencer(email, verificationCode);
        setSuccessData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [email, verificationCode]
  );

  const goToIdentifyStep = useCallback(() => {
    setError(null);
    setVerificationCode('');
    setStep('identify');
    resetCaptcha?.();
  }, [resetCaptcha]);

  const resetSuccess = useCallback(() => {
    setStep('identify');
    setPromoCode('');
    setEmail('');
    setVerificationCode('');
    setVerificationEmail('');
    setSuccessData(null);
    setError(null);
    resetCaptcha?.();
  }, [resetCaptcha]);

  return {
    step,
    promoCode,
    setPromoCode: (value) => setPromoCode(value.toUpperCase()),
    email,
    setEmail,
    verificationCode,
    setVerificationCode: (value) => setVerificationCode(value.replace(/\D/g, '').slice(0, 6)),
    verificationEmail,
    settings,
    settingsLoading,
    successData,
    loading,
    error,
    handleRequestVerification,
    handleRedeemPrize,
    goToIdentifyStep,
    resetSuccess,
  };
}
