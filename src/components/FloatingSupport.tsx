import { Mail } from 'lucide-react';

export function FloatingSupport() {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      <a
        href="https://wa.me/5500000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        title="Suporte via WhatsApp"
        aria-label="WhatsApp"
      >
        <Mail size={24} />
      </a>
      <a
        href="mailto:suporte@promocode.com"
        className="w-14 h-14 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        title="Suporte via E-mail"
        aria-label="E-mail"
      >
        <Mail size={24} />
      </a>
    </div>
  );
}
