/**
 * TermsView Component
 * Terms of use page
 */

import React from 'react';
import { LegalView } from './LegalView';

interface TermsViewProps {
  onBack: () => void;
}

export function TermsView({ onBack }: TermsViewProps) {
  const termsContent = `Ao utilizar este site, você concorda com os seguintes termos:

1. A promoção é válida apenas para códigos autênticos distribuídos pelos canais oficiais.

2. Tentativas de fraude ou uso indevido do sistema resultarão em bloqueio imediato.

3. Os prêmios estão sujeitos à disponibilidade e prazos estabelecidos na administração.`;

  return <LegalView title="Termos de Uso" content={termsContent} onBack={onBack} />;
}
