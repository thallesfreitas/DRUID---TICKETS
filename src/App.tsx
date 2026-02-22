/**
 * App.tsx - REFATORADO com SOLID, DRY, Clean Code
 *
 * Componente Principal - Simples e Focado
 *
 * Responsabilidades:
 * - Layout base (Header, Main, Footer, FloatingSupport)
 * - View routing
 * - State management (apenas view atual)
 *
 * Benefícios da Refatoração:
 * ✅ Linhas: 832 → ~100 (88% redução)
 * ✅ SRP: 1 responsabilidade (routing)
 * ✅ DRY: Lógica delegada aos subcomponentes
 * ✅ Testabilidade: Componentes testáveis isoladamente
 * ✅ Reutilização: Componentes e hooks reutilizáveis
 *
 * Componentes Extraídos:
 * - Header (cabeçalho com logo e botão admin)
 * - Footer (rodapé com links de navegação)
 * - FloatingSupport (botões de suporte flutuantes)
 * - ViewRouter (orquestra todas as views)
 * - RedeemView, AdminView, HelpView, PrivacyView, TermsView
 * - RedeemForm, RedeemSuccess
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingSupport } from './components/FloatingSupport';
import { ViewRouter } from './components/ViewRouter';
import { ViewType } from './types/api';

export default function App() {
  const [view, setView] = useState<ViewType>('redeem' as ViewType);

  const handleAdminClick = () => {
    setView(view === 'admin' ? ('redeem' as ViewType) : ('admin' as ViewType));
  };

  const handleLogoClick = () => {
    setView('redeem' as ViewType);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <Header onAdminClick={handleAdminClick} onLogoClick={handleLogoClick} />

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <ViewRouter view={view} setView={setView} />
      </main>

      {/* Footer */}
      <Footer setView={setView} />

      {/* Floating Support */}
      <FloatingSupport />
    </div>
  );
}
