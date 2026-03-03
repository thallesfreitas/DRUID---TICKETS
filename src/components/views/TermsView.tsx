/**
 * TermsView Component
 * Terms of use page
 */

import { LegalView } from './LegalView';

interface TermsViewProps {
  onBack: () => void;
}

export function TermsView({ onBack }: TermsViewProps) {
  const termsContent = (
    <>
      <p>A ZAMP possui o direito de alterar o teor destas Diretrizes de Privacidade a qualquer momento, conforme razoável juízo de conveniência e contexto temporal da empresa. Cabe ao Titular checar o teor destas Diretrizes de Privacidade com periodicidade recorrente, sob o intuito de confirmar a manutenção de sua concordância com os presentes termos, que, por sua vez, é condição no uso das Plataformas de Interação.</p>

      <p>Conforme destacado acima, para exercer os direitos previstos na LGPD, o Titular deverá submeter sua solicitação exclusivamente por meio do formulário disponível em Formulário de Solicitação dos Titulares dos Dados Pessoais BK. O e-mail lgpd@zamp.com.br permanecerá disponível como canal de contato com nosso DPO (Protiviti - ICTS Desenvolvimento de Sistemas e Tecnologia Ltda – CNPJ/MF nº 08.226.125/0001-46, representada por Fernando Fleider) e deverá ser utilizado apenas para dúvidas, esclarecimentos ou comunicações institucionais (incluindo comunicações de autoridades competentes, como a ANPD).</p>

      <p>Atualizada em 27/11/2025.</p>
    </>
  )

  return <LegalView title="DISPOSIÇÕES GERAIS" content={termsContent} onBack={onBack} />;
}
