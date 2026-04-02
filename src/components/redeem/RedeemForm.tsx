/**
 * RedeemForm - Fluxo público de resgate em duas etapas
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { RedeemStep } from '@/types/api';

interface RedeemFormProps {
  step: RedeemStep;
  promoCode: string;
  email: string;
  verificationCode: string;
  verificationEmail: string;
  loading: boolean;
  error: string | null;
  hasNotStarted: boolean;
  hasEnded: boolean;
  startDate?: string;
  onRequestVerification: (e: React.FormEvent) => void;
  onRedeemPrize: (e: React.FormEvent) => void;
  onPromoCodeChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onVerificationCodeChange: (value: string) => void;
  onBack: () => void;
  recaptchaMode: string;
  recaptchaReady: boolean;
  recaptchaToken: string;
  onRecaptchaRender?: (containerId: string) => void;
}

export function RedeemForm({
  step,
  promoCode,
  email,
  verificationCode,
  verificationEmail,
  loading,
  error,
  hasNotStarted,
  hasEnded,
  onRequestVerification,
  onRedeemPrize,
  onPromoCodeChange,
  onEmailChange,
  onVerificationCodeChange,
  onBack,
  startDate,
  recaptchaMode,
  recaptchaReady,
  recaptchaToken,
  onRecaptchaRender,
}: RedeemFormProps) {
  const [showTurnstile, setShowTurnstile] = useState(false);
  const renderedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const autoSubmittedRef = useRef(false);
  const isEnterprise = recaptchaMode === 'enterprise';

  useEffect(() => {
    if (step !== 'identify') {
      setShowTurnstile(false);
      autoSubmittedRef.current = false;
      renderedRef.current = false;
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'identify' || !showTurnstile || isEnterprise) return;
    if (recaptchaReady && !renderedRef.current && onRecaptchaRender) {
      renderedRef.current = true;
      onRecaptchaRender('recaptcha-container');
    }
  }, [step, showTurnstile, recaptchaReady, onRecaptchaRender, isEnterprise]);

  useEffect(() => {
    if (!recaptchaToken) autoSubmittedRef.current = false;
  }, [recaptchaToken]);

  useEffect(() => {
    if (step !== 'identify') return;
    if (!showTurnstile || isEnterprise || !recaptchaToken || loading || autoSubmittedRef.current || error) return;
    autoSubmittedRef.current = true;
    formRef.current?.requestSubmit();
  }, [step, showTurnstile, recaptchaToken, isEnterprise, loading, error]);

  const isDisabled = hasNotStarted || hasEnded;

  const handleSubmit = (e: React.FormEvent) => {
    if (step === 'identify') {
      if (!showTurnstile) {
        e.preventDefault();
        if (promoCode.trim() && email.trim()) setShowTurnstile(true);
        return;
      }

      onRequestVerification(e);
      return;
    }

    onRedeemPrize(e);
  };

  const getPrimaryButtonText = () => {
    if (hasEnded) return 'Campanha finalizada';
    if (hasNotStarted) {
      if (startDate) {
        return `Início em ${new Date(startDate).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      }
      return 'Aguarde o início';
    }

    if (loading) return 'Processando...';
    return step === 'identify' ? 'VALIDAR SEU EMAIL' : 'RESGATAR PRÊMIO';
  };

  const isPrimaryDisabled =
    loading ||
    isDisabled ||
    (step === 'identify'
      ? (isEnterprise ? !recaptchaReady : (showTurnstile ? !recaptchaToken : false))
      : verificationCode.trim().length !== 6);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Resgatar Código
        </h2>
        <p className="text-slate-500 mt-2">
          {step === 'identify'
            ? 'Informe o código promocional oficial e valide a posse do seu e-mail para participar.'
            : 'Enviamos um código de 6 dígitos para o e-mail informado. Digite-o abaixo para liberar seu prêmio.'}
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-700 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium leading-tight">{error}</p>
          </motion.div>
        )}

        {step === 'identify' ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                Código promocional
              </label>
              <input
                type="text"
                required
                disabled={isDisabled}
                value={promoCode}
                onChange={(e) => onPromoCodeChange(e.target.value)}
                placeholder="EX: BKCLASHPROMO2026"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all outline-none font-mono tracking-wider text-base uppercase disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                Seu e-mail
              </label>
              <input
                type="email"
                required
                disabled={isDisabled}
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all outline-none text-base disabled:opacity-50"
              />
            </div>

            {!isEnterprise && showTurnstile && (
              <div className="flex items-center justify-center w-full">
                <div id="recaptcha-container" className="cf-turnstile" data-size="compact" />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 flex items-start gap-3">
              <MailCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Enviamos um código de 6 dígitos para <strong>{verificationEmail || email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                Código de validação
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => onVerificationCodeChange(e.target.value)}
                placeholder="000000"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all outline-none font-mono tracking-[0.4em] text-center text-lg"
              />
            </div>

            <button
              type="button"
              onClick={onBack}
              className="w-full border border-slate-200 text-slate-700 font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Alterar dados</span>
            </button>
          </>
        )}

        <button
          type="submit"
          disabled={isPrimaryDisabled}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center space-x-2 active:scale-95"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span>{getPrimaryButtonText()}</span>
              {!isDisabled && <ArrowRight className="w-5 h-5" />}
            </>
          )}
        </button>
      </form>

      <p className="text-[11px] text-center text-slate-500 mt-6 px-4 leading-relaxed">
        Cada e-mail pode concluir apenas um resgate. O prêmio é sorteado aleatoriamente após a validação do código enviado por e-mail.
      </p>
    </div>
  );
}
