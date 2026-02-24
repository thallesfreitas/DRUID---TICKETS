/**
 * ViewRouter Component
 * Routes between different views based on current view state
 * Single Responsibility: View switching logic
 */

import { AnimatePresence } from 'motion/react';
import { ViewType } from '@/types/api';
import { RedeemViewOrWithRecaptcha } from './views/RedeemView';
import { HelpView } from './views/HelpView';
import { PrivacyView } from './views/PrivacyView';
import { TermsView } from './views/TermsView';
import { AdminView } from './views/AdminView';

interface ViewRouterProps {
  view: ViewType;
  setView: (view: ViewType) => void;
}

export function ViewRouter({ view, setView }: ViewRouterProps) {
  const handleBack = () => setView('redeem' as ViewType);

  return (
    <AnimatePresence mode="wait">
      {view === 'redeem' && <RedeemViewOrWithRecaptcha key="redeem" />}
      {view === 'help' && <HelpView key="help" onBack={handleBack} />}
      {view === 'privacy' && <PrivacyView key="privacy" onBack={handleBack} />}
      {view === 'terms' && <TermsView key="terms" onBack={handleBack} />}
      {view === 'admin' && <AdminView key="admin" onBack={handleBack} />}
    </AnimatePresence>
  );
}
