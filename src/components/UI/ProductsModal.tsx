import React, { useEffect } from 'react';
import { X, Sparkles, Mail, Layers, ArrowRight } from 'lucide-react';

export interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
}

export const ProductsModal: React.FC<ProductsModalProps> = ({
  isOpen,
  onClose,
  onOpenContact,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="products-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#090b14]/95 border border-white/15 rounded-2xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-200 select-text"
      >
        {/* Subtle Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Products Modal"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">
              Digital Inventions
            </span>
          </div>
          <h2
            id="products-modal-title"
            className="text-2xl font-bold text-white tracking-wide font-fantasy"
          >
            Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            Software products, open-source toolsets, and computational suites in active development.
          </p>
        </div>

        {/* Informative Ready-for-Content Section */}
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Upcoming Product Releases
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive developer tools, local AI assistant modules, and real-time graphics utilities are currently being prepared for public release.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-cyan-200">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Looking for custom product architecture or early previews?</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onOpenContact && (
          <button
            onClick={() => {
              onClose();
              onOpenContact();
            }}
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 text-black py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shadow-lg"
          >
            <Mail className="w-4 h-4" />
            <span>Inquire via Contact</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

