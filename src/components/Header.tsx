import { Ticket, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onLogoClick?: () => void;
  onAdminClick?: () => void;
  showAdminButton?: boolean;
}

export function Header({ onLogoClick, onAdminClick, showAdminButton = false }: HeaderProps) {
  return (
    <header className="w-full py-6 px-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
      <Link
        to="/"
        onClick={onLogoClick}
        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        aria-label="Home"
      >
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
          <Ticket className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">PromoCode</h1>
      </Link>
      {showAdminButton && (
        <Link
          to="/admin"
          onClick={onAdminClick}
          className="p-2 text-slate-400 hover:text-orange-600 transition-colors rounded-lg hover:bg-orange-50"
          aria-label="Admin Panel"
        >
          <LayoutDashboard size={20} />
        </Link>
      )}
    </header>
  );
}
