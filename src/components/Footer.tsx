import { ViewType } from '@/types/api';

interface FooterProps {
  setView: (view: ViewType) => void;
}

export function Footer({ setView }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 text-center text-white text-xs mt-auto">
      <div className="flex justify-center space-x-6 mb-4">
        <button onClick={() => setView('help')} className="hover:text-white/80">Ajuda</button>
        <button onClick={() => setView('privacy')} className="hover:text-white/80">Privacidade</button>
        <button onClick={() => setView('terms')} className="hover:text-white/80">Termos</button>
      </div>
      <p>© 2026 Burger King Company LLC. & Supercell Oy. Todos os direitos reservados.</p>
    </footer>
  );
}
