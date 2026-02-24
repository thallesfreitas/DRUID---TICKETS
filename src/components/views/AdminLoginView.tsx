/**
 * AdminLoginView - Login por e-mail e código
 * Passo 1: e-mail + "Receber código" | Passo 2: código + "Entrar"
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, KeyRound, Loader2 } from 'lucide-react';
import { AdminService } from '@/services/api/admin';
import { apiClient } from '@/services/api/client';
import { setAdminToken } from '@/lib/adminAuth';

const adminService = new AdminService(apiClient);

interface AdminLoginViewProps {
  onSuccess: () => void;
}

export function AdminLoginView({ onSuccess }: AdminLoginViewProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Informe o e-mail.');
      return;
    }
    setLoading(true);
    try {
      await adminService.requestCode(trimmed);
      setMessage('Se o e-mail estiver cadastrado, você receberá um código em instantes.');
      setStep('code');
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Informe o código recebido por e-mail.');
      return;
    }
    setLoading(true);
    try {
      const res = await adminService.verifyCode(email.trim(), trimmedCode);
      if (res.success && res.token) {
        setAdminToken(res.token);
        onSuccess();
      } else {
        setError('Código inválido ou expirado.');
      }
    } catch (err: any) {
      setError(err?.message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">
          Acesso ao painel
        </h2>

        <div className="min-h-[280px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'email' ? (
              <motion.form
                key="email"
                onSubmit={handleRequestCode}
                className="space-y-4"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>
                {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Receber código'
                  )}
                </button>
              </motion.form>
            ) : null}

            {step === 'code' ? (
              <motion.form
                key="code"
                onSubmit={handleVerifyCode}
                className="space-y-4"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {message ? (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3" role="status">{message}</p>
                ) : null}
                <div className="text-sm text-slate-500">
                  E-mail: <span className="font-medium text-slate-700">{email}</span>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setCode(''); setMessage(null); setError(null); }}
                    className="ml-2 text-orange-600 hover:underline"
                  >
                    Alterar
                  </button>
                </div>
                <div>
                  <label htmlFor="admin-code" className="block text-sm font-medium text-slate-700 mb-1">
                    Código
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="admin-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition font-mono text-lg tracking-widest"
                      maxLength={6}
                      disabled={loading}
                    />
                  </div>
                </div>
                {error ? (
                  <p className="text-sm text-red-600" role="alert">{error}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Entrar'
                  )}
                </button>
              </motion.form>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
