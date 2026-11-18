import React, { useState, useEffect } from 'react';
import { X, Mail, Check, ExternalLink, Send, MessageSquare } from 'lucide-react';

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const contactEmail = 'prins.engineering@outlook.com';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setMessage('');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#090b14]/95 border border-white/15 rounded-2xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 select-text"
      >
        {/* Subtle Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Contact Modal"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">
              Get In Touch
            </span>
          </div>
          <h2
            id="contact-modal-title"
            className="text-2xl font-bold text-white tracking-wide font-fantasy"
          >
            Contact
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            Available for software engineering quests, interactive 3D computing, and high-impact full-stack collaborations.
          </p>
        </div>

        {/* Direct Email Card */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Direct Inquiries
              </div>
              <div className="text-xs sm:text-sm font-mono font-medium text-slate-200 truncate">
                {contactEmail}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <span>Copy</span>
              )}
            </button>
            <a
              href={`mailto:${contactEmail}`}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Open email client"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Contact Form */}
        {submitted ? (
          <div className="py-8 text-center bg-white/5 rounded-xl border border-emerald-500/30 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Message Dispatched!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Thank you for reaching out. I will respond to your transmission promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Message
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your quest details, project inquiry, or greetings..."
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Response within 24 hours</span>
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-white text-black hover:bg-slate-200 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
              >
                <span>Send Message</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

