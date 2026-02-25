/**
 * RedeemForm Component
 * Responsible for rendering the code redemption form
 * Integrado com verificação humana via Turnstile/recaptcha hooks
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface RedeemFormProps {
  code: string;
  loading: boolean;
  error: string | null;
  isStarted: boolean;
  isEnded: boolean;
  startDate?: string;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (code: string) => void;
  recaptchaMode: string;
  recaptchaReady: boolean;
  recaptchaToken: string;        // token do v2 (vazio no enterprise)
  onRecaptchaRender?: (containerId: string) => void; // só v2
}

export function RedeemForm({
  code,
  loading,
  error,
  isStarted,
  isEnded,
  onSubmit,
  onChange,
  startDate,
  recaptchaMode,
  recaptchaReady,
  recaptchaToken,
  onRecaptchaRender,
}: RedeemFormProps) {
  const renderedRef = useRef(false);
  const isEnterprise = recaptchaMode === 'enterprise';

  // Renderizar widget v2 quando pronto
  useEffect(() => {
    if (!isEnterprise && recaptchaReady && !renderedRef.current && onRecaptchaRender) {
      renderedRef.current = true;
      onRecaptchaRender('recaptcha-container');
    }
  }, [recaptchaReady, onRecaptchaRender, isEnterprise]);

  const isDisabled = !isStarted || isEnded;

  // Enterprise: basta estar ready; v2: precisa do token
  const isSubmitDisabled = isEnterprise
    ? loading || isDisabled || !recaptchaReady
    : loading || isDisabled || !recaptchaToken;

  const getButtonText = () => {
    if (isEnded) return 'RESGATES ENCERRADOS';
    if (!isStarted) {
      if (startDate) return `INÍCIO EM ${new Date(startDate).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      return 'Aguarde o início';
    }
    return loading ? 'Processando...' : 'Validar Código';
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Resgatar Código
        </h2>
        <p className="text-slate-500 mt-2">
          Insira o código impresso no cupom fiscal de sua compra no BK para ter acesso ao prêmio único e exclusivo.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
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

        {/* Code Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
            Código Promocional
          </label>
          <input
            type="text"
            required
            disabled={isDisabled}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            placeholder="EX: PROMO2024"
            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all outline-none font-mono tracking-widest text-lg uppercase disabled:opacity-50"
          />
        </div>

        {/* Widget de verificação humana (v2/Turnstile) */}
        {!isEnterprise && (
          <div className="flex items-center justify-center">
            <div id="recaptcha-container"></div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isStarted || isEnded}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center space-x-2 active:scale-95"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span>{getButtonText()}</span>
              {isStarted && !isEnded && <ArrowRight className="w-5 h-5" />}
            </>
          )}
        </button>
      </form>

      <p className="text-[11px] text-center text-slate-400 mt-6 px-4 leading-relaxed">
        Códigos de uso único. Digite o código em letras MAIÚSCULAS, exatamente como impresso no seu cupom fiscal. Em caso de dúvidas, entre em contato com o suporte.
      </p>
      {isEnterprise && (
        <p className="text-[10px] text-center text-slate-400 mt-2 px-4">
          Protegido por reCAPTCHA Enterprise. Aplicam-se a{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidade</a>
          {' '}e os{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">Termos de Serviço</a>
          {' '}do Google.
        </p>
      )}
    </div>
  );
}
