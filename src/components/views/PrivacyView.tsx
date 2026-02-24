/**
 * PrivacyView Component
 * Privacy policy page
 */

import React from 'react';
import { LegalView } from './LegalView';

interface PrivacyViewProps {
  onBack: () => void;
}

export function PrivacyView({ onBack }: PrivacyViewProps) {
  const privacyContent = `Nós valorizamos a sua privacidade. Esta política descreve como coletamos e usamos seus dados.

Coletamos apenas as informações necessárias para validar seu código e garantir a segurança da promoção, como seu endereço IP e data de acesso.

Seus dados não são compartilhados com terceiros para fins de marketing.`;

  return <LegalView title="Política de Privacidade" content={privacyContent} onBack={onBack} />;
}
