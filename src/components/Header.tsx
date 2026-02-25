
interface HeaderProps {
  onLogoClick?: () => void;
  onAdminClick?: () => void;
  showAdminButton?: boolean;
}

export function Header({ onLogoClick, onAdminClick, showAdminButton = false }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 py-4 px-6 bg-[#f7f9fb] border-b border-slate-200/60 shadow-sm z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <button onClick={onLogoClick} className="flex items-center hover:opacity-80 transition-opacity">
          {/* Removemos o divisor e usamos um gap generoso para separação visual clara */}
          <div className="flex items-center gap-8">

            {/* Logo Clash Royale: Mantemos o aumento para compensar a borda transparente */}
            <img
              src="https://store.supercell.com/_next/static/media/logo.212723e6.png"
              alt="Clash Royale"
              className="h-10 w-auto object-contain scale-150 transform"
              referrerPolicy="no-referrer"
            />

            {/* Logo Burger King: Aumentamos a escala para h-12 e scale-110 para igualar o peso visual */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Burger_King_2020_Berdai_Othmane.png"
              alt="Burger King"
              className="h-12 w-auto object-contain scale-110 transform"
              referrerPolicy="no-referrer"
            />

          </div>
        </button>


      </div>
    </header>
  );
}
