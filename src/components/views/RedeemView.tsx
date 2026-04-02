/**
 * RedeemView - Container do resgate com reCAPTCHA v2 (Turnstile)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useRecaptchaV2 } from '@/hooks/useRecaptchaV2';
import { useRedeem } from '@/hooks/useRedeem';
import { RedeemForm } from '@/components/redeem/RedeemForm';
import { RedeemSuccess } from '@/components/redeem/RedeemSuccess';

export function RedeemView() {
  const v2 = useRecaptchaV2();
  const getCaptchaToken = async (): Promise<string> => v2.token;

  const redeem = useRedeem({ getCaptchaToken, resetCaptcha: v2.resetWidget });
  const [copied, setCopied] = useState(false);

  const hasNotStarted = Boolean(
    redeem.settings?.start_date && new Date(redeem.settings.start_date) >= new Date()
  );
  const hasEnded = Boolean(
    redeem.settings?.end_date && new Date(redeem.settings.end_date) < new Date()
  );

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    await redeem.handleRequestVerification(e);
  };

  const handleRedeemPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    await redeem.handleRedeemPrize(e);
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
        step={redeem.step}
        promoCode={redeem.promoCode}
        email={redeem.email}
        verificationCode={redeem.verificationCode}
        verificationEmail={redeem.verificationEmail}
        loading={redeem.loading}
        error={redeem.error}
        hasNotStarted={hasNotStarted}
        hasEnded={hasEnded}
        startDate={redeem.settings?.start_date}
        onRequestVerification={handleRequestVerification}
        onRedeemPrize={handleRedeemPrize}
        onPromoCodeChange={redeem.setPromoCode}
        onEmailChange={redeem.setEmail}
        onVerificationCodeChange={redeem.setVerificationCode}
        onBack={redeem.goToIdentifyStep}
        recaptchaMode="v2"
        recaptchaReady={v2.ready}
        recaptchaToken={v2.token}
        onRecaptchaRender={v2.renderWidget}
      />
    </motion.div>
  );
}

export { RedeemView as RedeemViewOrWithRecaptcha };
