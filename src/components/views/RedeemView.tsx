/**
 * RedeemView Component
 * Container for the redeem feature
 * Handles state and logic delegation
 * Renders either RedeemForm or RedeemSuccess based on state
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useRedeem } from '@/hooks/useRedeem';
import { RedeemForm } from '@/components/redeem/RedeemForm';
import { RedeemSuccess } from '@/components/redeem/RedeemSuccess';

export function RedeemView() {
  const redeem = useRedeem();
  const [copied, setCopied] = useState(false);

  // Date validation
  const isStarted = !redeem.settings?.start_date || new Date(redeem.settings.start_date) <= new Date();
  const isEnded = redeem.settings?.end_date && new Date(redeem.settings.end_date) < new Date();

  // Handle form submission
  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeem.captchaVerified) return;
    await redeem.handleRedeem(e);
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    if (redeem.successData?.link) {
      navigator.clipboard.writeText(redeem.successData.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Toggle between form and success states
  if (redeem.successData) {
    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-md"
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
      className="w-full max-w-md"
    >
      <RedeemForm
        code={redeem.code}
        loading={redeem.loading}
        error={redeem.error}
        captchaVerified={redeem.captchaVerified}
        isStarted={isStarted}
        isEnded={isEnded}
        startDate={redeem.settings?.start_date}
        onSubmit={handleRedeem}
        onChange={redeem.setCode}
        onCaptchaChange={() => redeem.setCaptchaVerified(!redeem.captchaVerified)}
      />
    </motion.div>
  );
}
