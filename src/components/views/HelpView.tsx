/**
 * HelpView Component
 * FAQ and help information page
 */

import { LegalView } from './LegalView';

interface HelpViewProps {
  onBack: () => void;
}

export function HelpView({ onBack }: HelpViewProps) {
  const helpContent = (
    <>
      <div>
        <h3 className="font-bold text-slate-800 mb-2">Como resgato meu código?</h3>
        <p className="text-slate-600 text-sm">
          Basta inserir o código recebido no campo da página inicial e clicar em validar.
        </p>
      </div>
      <div>
        <h3 className="font-bold text-slate-800 mb-2">Meu código não funciona, o que fazer?</h3>
        <p className="text-slate-600 text-sm">
          Verifique se digitou corretamente, respeitando maiúsculas e minúsculas. Se o
          problema persistir, entre em contato com o suporte.
        </p>
      </div>
      <div>
        <h3 className="font-bold text-slate-800 mb-2">
          Quantas vezes posso usar o mesmo código?
        </h3>
        <p className="text-slate-600 text-sm">
          Cada código é único e pode ser utilizado apenas uma única vez.
        </p>
      </div>
    </>
  );

  return <LegalView title="Ajuda & FAQ" content={helpContent} onBack={onBack} />;
}
