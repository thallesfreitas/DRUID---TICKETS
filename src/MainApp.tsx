/**
 * MainApp - Tela inicial (rota /): resgate, ajuda, privacidade, termos.
 * Sem botão de admin na interface.
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingSupport } from './components/FloatingSupport';
import { ViewRouter } from './components/ViewRouter';
import { ViewType } from './types/api';

export function MainApp() {
  const [view, setView] = useState<ViewType>('redeem' as ViewType);

  return (
    <div className="min-h-screen bg-[#1481d8] flex flex-col font-sans text-slate-900">
      <Header showAdminButton={false} />
      <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <ViewRouter view={view} setView={setView} />
      </main>
      <Footer setView={setView} />
      <FloatingSupport />
    </div>
  );
}
