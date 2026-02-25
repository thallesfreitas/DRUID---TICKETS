/**
 * LegalView Component
 * Reusable component for legal pages (Help, Privacy, Terms)
 * Single Responsibility: Render legal/informational content
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface LegalViewProps {
  title: string;
  content: string | React.ReactNode;
  onBack: () => void;
}

export function LegalView({ title, content, onBack }: LegalViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-[500px]:mt-24"
    >
      <h2 className="text-3xl font-black text-slate-900 mb-6">{title}</h2>

      {typeof content === 'string' ? (
        <div className="prose prose-slate max-w-none text-slate-600 text-sm space-y-4">
          {content.split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      ) : (
        <div className="space-y-6">{content}</div>
      )}

      <button
        onClick={onBack}
        className="mt-8 text-orange-600 font-bold flex items-center gap-2"
      >
        <ArrowRight size={18} className="rotate-180" />
        Voltar ao início
      </button>
    </motion.div>
  );
}
