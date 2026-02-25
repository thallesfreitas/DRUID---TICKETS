/**
 * RedeemSuccess Component
 * Displays success message and sharing options after successful code redemption
 * Single Responsibility: UI Only
 */

import { motion } from 'motion/react';
import { CheckCircle2, Copy, ExternalLink, Mail } from 'lucide-react';

interface RedeemSuccessProps {
  link: string;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
}

export function RedeemSuccess({ link, copied, onCopy, onReset }: RedeemSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-3xl shadow-xl shadow-green-100/50 border border-green-100 text-center "
    >
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      {/* Success Title */}
      <h2 className="text-2xl font-extrabold text-slate-900">Resgate Concluído!</h2>
      <p className="text-slate-500 mt-2 mb-6">
        Seu benefício exclusivo foi liberado com sucesso.
      </p>

      {/* Reward Image */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <img
          src="https://picsum.photos/seed/reward/600/300"
          alt="Prêmio"
          className="w-full h-40 object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Link Display Box */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 text-left">

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Open Link Button */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-100"
          >
            <ExternalLink className='max-[360px]:w-4 max-[360px]:h-4' size={18} />
            <span className='max-[360px]:text-sm'>Acessar Prêmio</span>
          </a>

          {/* Copy and WhatsApp Buttons */}
          <div className="grid gap-3 grid-cols-2 max-[360px]:grid-cols-1">
            <button
              onClick={onCopy}
              className="flex items-center justify-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold transition-all shadow-sm"
            >
              <Copy size={18} />
              <span className='max-[360px]:text-sm'>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Olha só o prêmio que eu ganhei: ${link}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-bold transition-all shadow-sm"
            >
              <Mail size={18} />
              <span className='max-[360px]:text-sm'>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center justify-center mx-auto transition-colors"
      >
        Resgatar outro código
      </button>
    </motion.div>
  );
}
