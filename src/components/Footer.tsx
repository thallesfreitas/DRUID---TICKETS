import { ViewType } from '@/types/api';

interface FooterProps {
  setView: (view: ViewType) => void;
}

export function Footer({ setView }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleViewChange = (view: ViewType) => {
    setView(view);
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer className="py-14 text-center justify-center flex flex-col items-center text-white text-xs mt-auto w-full">
      <div className="flex justify-center space-x-6 mb-4">
        <button onClick={() => handleViewChange('help')} className="hover:text-white/80">Ajuda</button>
        <button onClick={() => handleViewChange('privacy')} className="hover:text-white/80">Privacidade</button>
        <button onClick={() => handleViewChange('terms')} className="hover:text-white/80">Termos</button>
      </div>
      <p className="flex justify-center space-x-6 mb-4 px-8 text-center w-[80%]">
        © 2026 Burger King Company LLC. & Supercell Oy. Todos os direitos reservados.</p>
    </footer>
  );
}
