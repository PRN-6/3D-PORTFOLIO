import React, { useEffect } from 'react';
import { X, Sparkles, Mail, Layers, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePresence } from '../../hooks/usePresence';

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
  const { isLight } = useTheme();
  const presence = usePresence(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!presence.isMounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="products-modal-title"
      data-state={presence.state}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200 select-text overflow-hidden ${
          isLight
            ? 'bg-[#f4eee0]/95 border border-[#c8bc9f] text-[#2c2823] shadow-[0_20px_60px_rgba(180,160,130,0.35)]'
            : 'bg-[#090b14]/95 border border-white/15 text-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Subtle Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Products Modal"
          className={`absolute top-5 right-5 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight
              ? 'text-[#5c5446] hover:text-[#1c1a17] hover:bg-black/5'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span
              className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${
                isLight ? 'text-cyan-800' : 'text-cyan-300'
              }`}
            >
              Digital Inventions
            </span>
          </div>
          <h2
            id="products-modal-title"
            className={`text-2xl font-bold tracking-wide font-fantasy ${
              isLight ? 'text-[#1c1a17]' : 'text-white'
            }`}
          >
            Products
          </h2>
          <p
            className={`text-xs sm:text-sm mt-1 leading-relaxed ${
              isLight ? 'text-[#5c5446]' : 'text-slate-400'
            }`}
          >
            Software products, open-source toolsets, and computational suites in active development.
          </p>
        </div>

        {/* Informative Ready-for-Content Section */}
        <div className="space-y-4 mb-6">
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'bg-[#eae1cf] border-[#cfc3a9]'
                : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                  isLight
                    ? 'bg-cyan-600/15 text-cyan-800'
                    : 'bg-cyan-500/15 text-cyan-400'
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold mb-1 ${
                    isLight ? 'text-[#1c1a17]' : 'text-white'
                  }`}
                >
                  Upcoming Product Releases
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isLight ? 'text-[#5c5446]' : 'text-slate-400'
                  }`}
                >
                  Interactive developer tools, local AI assistant modules, and real-time graphics utilities are currently being prepared for public release.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              isLight
                ? 'bg-[#e2d7c2] border-[#cfc3a9]'
                : 'bg-cyan-950/20 border-cyan-500/20'
            }`}
          >
            <div
              className={`flex items-center gap-2.5 text-xs ${
                isLight ? 'text-[#3d372e]' : 'text-cyan-200'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 shrink-0 ${
                  isLight ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              />
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
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shadow-lg ${
              isLight
                ? 'bg-[#1c1a17] hover:bg-[#332e26] text-[#f4eee0]'
                : 'bg-white hover:bg-slate-200 text-black'
            }`}
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
