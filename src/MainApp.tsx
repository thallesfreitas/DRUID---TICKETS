/**
 * MainApp - Tela inicial (rota /): resgate, ajuda, privacidade, termos.
 * Se VITE_PROTECTED_PASSWORD=Y, exige senha; se N ou não definido, abre direto.
 */

import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingSupport } from './components/FloatingSupport';
import { ViewRouter } from './components/ViewRouter';
import { ViewType } from './types/api';
import { PasswordGate, getIsUnlocked } from './components/PasswordGate';

const isPasswordProtected = import.meta.env.VITE_PROTECTED_PASSWORD === 'Y';

export function MainApp() {
  const [view, setView] = useState<ViewType>('redeem' as ViewType);
  const [unlocked, setUnlocked] = useState(() =>
    !isPasswordProtected || getIsUnlocked()
  );

  const handleUnlock = useCallback(() => setUnlocked(true), []);

  if (isPasswordProtected && !unlocked) {
    return <PasswordGate onSuccess={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-[#1481d8] flex flex-col font-sans text-slate-900">
      <Header showAdminButton={false} />
      <main id="main-content" className="flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full">
        <ViewRouter view={view} setView={setView} />
      </main>
      <Footer setView={setView} />
      <FloatingSupport />
    </div>
  );
}
