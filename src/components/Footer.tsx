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
      <p>© {currentYear} PromoCode Inc. <br></br>Todos os direitos reservados.</p>
      {/* <hr className="my-4 border-slate-200" />
      <small className="text-slate-400 text-xs w-full mx-auto pr-4 pl-4 text-left flex flex-col items-start justify-start" >
        <span>Este site é protegido pelo <strong>reCAPTCHA</strong> e a</span>
        <span><a href="https://policies.google.com/privacy" className="text-slate-600 hover:text-slate-700 transition-colors">Política de Privacidade</a> e <a href="https://policies.google.com/terms" className="text-slate-600 hover:text-slate-700 transition-colors">Termos de Serviço</a></span>
        <span> do Google se aplicam.</span>
      </small> */}
    </footer>
  );
}
