/**
 * RedeemView - Container do resgate com reCAPTCHA
 * Suporta v2 (checkbox) e Enterprise (invisível) via RECAPTCHA_MODE
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useRecaptchaV2 } from '@/hooks/useRecaptchaV2';
import { useRecaptchaEnterprise } from '@/hooks/useRecaptchaEnterprise';
import { useRedeem } from '@/hooks/useRedeem';
import { RedeemForm } from '@/components/redeem/RedeemForm';
import { RedeemSuccess } from '@/components/redeem/RedeemSuccess';

const RECAPTCHA_MODE = process.env.RECAPTCHA_MODE || 'v2';
const isEnterprise = RECAPTCHA_MODE === 'enterprise';

export function RedeemView() {
  // Carrega o hook correto baseado no modo
  const v2 = useRecaptchaV2();
  const enterprise = useRecaptchaEnterprise();

  // Função para obter token: v2 já tem, enterprise precisa executar
  const getCaptchaToken = async (): Promise<string> => {
    if (isEnterprise) {
      return enterprise.executeRecaptcha();
    }
    return v2.token;
  };

  const redeem = useRedeem({ getCaptchaToken });
  const [copied, setCopied] = useState(false);

  const isStarted = !redeem.settings?.start_date || new Date(redeem.settings.start_date) <= new Date();
  const isEnded = redeem.settings?.end_date && new Date(redeem.settings.end_date) < new Date();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    await redeem.handleRedeem(e);
  };

  const handleCopy = () => {
    if (redeem.successData?.link) {
      navigator.clipboard.writeText(redeem.successData.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (redeem.successData) {
    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-md pt-24"
      >
        <RedeemSuccess
          link={redeem.successData.link}
          copied={copied}
          onCopy={handleCopy}
          onReset={redeem.resetSuccess}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md pt-24"
    >
      <RedeemForm
        code={redeem.code}
        loading={redeem.loading}
        error={redeem.error}
        isStarted={isStarted}
        isEnded={isEnded}
        startDate={redeem.settings?.start_date}
        onSubmit={handleRedeem}
        onChange={redeem.setCode}
        recaptchaMode={RECAPTCHA_MODE}
        recaptchaReady={isEnterprise ? enterprise.ready : v2.ready}
        recaptchaToken={isEnterprise ? '' : v2.token}
        onRecaptchaRender={isEnterprise ? undefined : v2.renderWidget}
      />
    </motion.div>
  );
}

export { RedeemView as RedeemViewOrWithRecaptcha };
