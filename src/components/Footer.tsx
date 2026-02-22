import { ViewType } from '@/types/api';

interface FooterProps {
  setView: (view: ViewType) => void;
}

export function Footer({ setView }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 text-center text-slate-400 text-xs mt-auto">
      <div className="flex justify-center space-x-6 mb-4">
        <button onClick={() => setView('help')} className="hover:text-slate-600 transition-colors">
          Ajuda
        </button>
        <button onClick={() => setView('privacy')} className="hover:text-slate-600 transition-colors">
          Privacidade
        </button>
        <button onClick={() => setView('terms')} className="hover:text-slate-600 transition-colors">
          Termos
        </button>
      </div>
      <p>© {currentYear} PromoCode Inc. Todos os direitos reservados.</p>
    </footer>
  );
}
