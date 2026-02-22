/**
 * RedeemForm Component
 * Responsible for rendering the code redemption form
 * Single Responsibility: UI Only
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface RedeemFormProps {
  code: string;
  loading: boolean;
  error: string | null;
  captchaVerified: boolean;
  isStarted: boolean;
  isEnded: boolean;
  startDate?: string;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (code: string) => void;
  onCaptchaChange: () => void;
}

export function RedeemForm({
  code,
  loading,
  error,
  captchaVerified,
  isStarted,
  isEnded,
  onSubmit,
  onChange,
  onCaptchaChange,
  startDate,
}: RedeemFormProps) {
  const isDisabled = !isStarted || isEnded;

  const getButtonText = () => {
    if (isEnded) return 'RESGATES ENCERRADOS';
    if (!isStarted) {
      if (startDate) return `INÍCIO EM ${new Date(startDate).toLocaleString()}`;
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
          Insira seu código único para acessar seu benefício exclusivo.
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

        {/* reCAPTCHA Mock */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={isDisabled}
              onClick={onCaptchaChange}
              className={`w-6 h-6 rounded border-2 transition-all flex items-center justify-center ${
                captchaVerified
                  ? 'bg-orange-600 border-orange-600'
                  : 'bg-white border-slate-300'
              } disabled:opacity-50`}
            >
              {captchaVerified && <CheckCircle2 className="text-white w-4 h-4" />}
            </button>
            <span className="text-sm font-medium text-slate-600">Não sou um robô</span>
          </div>
          <img
            src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
            alt="reCAPTCHA"
            className="w-6 h-6 opacity-50"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !captchaVerified || isDisabled}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center space-x-2 active:scale-95"
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
        Os códigos são de uso único e sensíveis a maiúsculas. Em caso de dúvidas, entre
        em contato com o suporte.
      </p>
    </div>
  );
}
