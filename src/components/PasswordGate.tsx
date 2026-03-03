/**
 * PasswordGate - Protege a página inicial com senha. Exibe form até senha correta.
 */

import { useState, FormEvent } from 'react';

const STORAGE_KEY = 'app_unlocked';
// Vite expõe só variáveis com prefixo VITE_; no .env use: VITE_EXPECTED_PASSWORD=sua_senha
const EXPECTED_PASSWORD = import.meta.env.VITE_EXPECTED_PASSWORD ?? '';

export function getIsUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function setUnlocked(): void {
  sessionStorage.setItem(STORAGE_KEY, '1');
}

interface PasswordGateProps {
  onSuccess: () => void;
}

export function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.trim() !== EXPECTED_PASSWORD) {
      setError('Senha incorreta.');
      return;
    }
    setUnlocked();
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#1481d8] flex flex-col items-center justify-center p-6 font-sans text-slate-900">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-xl font-semibold text-slate-800 text-center mb-2">
          Acesso restrito
        </h1>
        <p className="text-slate-600 text-center text-sm mb-6">
          Digite a senha para acessar a página.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-[#1481d8] focus:ring-2 focus:ring-[#1481d8]/20 outline-none transition"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-[#1481d8] text-white font-medium rounded-lg hover:bg-[#126bc4] transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
