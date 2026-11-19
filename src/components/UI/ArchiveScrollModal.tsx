import React, { useState, useEffect } from 'react';
import { X, Scroll, Award, GraduationCap, Briefcase, User, Sparkles } from 'lucide-react';
import { MAGE_PROFILE_DATA } from '../../data/archiveData';
import { BlueFlowerGardenViewer } from './BlueFlowerGardenViewer';

export interface ArchiveScrollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'bio' | 'chronicle' | 'academies' | 'accolades';

export const ArchiveScrollModal: React.FC<ArchiveScrollModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('bio');
  const profile = MAGE_PROFILE_DATA;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="The Archmage's Chronicle"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Parchment Scroll Modal Container */}
      <div className="relative z-50 w-full max-w-4xl max-h-[92vh] flex flex-col pointer-events-auto overflow-hidden rounded-2xl bg-[#0c0e1a]/95 text-slate-200 border border-amber-500/30 shadow-[0_24px_70px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-250">
        {/* Ornate Gold Trim Header Banner */}
        <div className="relative bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-amber-950/40 border-b border-amber-500/20 p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Scroll className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-fantasy text-xl sm:text-2xl font-bold text-amber-100 tracking-wide">
                    {profile.name}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest hidden sm:inline">
                    Archmage Codex
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {profile.title}
                </p>
                <p className="text-[11px] text-amber-400/80 italic mt-0.5">
                  {profile.epithet}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close chronicle scroll"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-1 sm:gap-2 mt-5 pt-3 border-t border-white/5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('bio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'bio'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Lore & Bio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chronicle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'chronicle'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Chronicle & Feats</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('academies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'academies'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Academies</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('accolades')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'accolades'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Accolades</span>
            </button>
          </div>
        </div>

        {/* Scrollable Parchment Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent via-[#090b14]/50 to-[#07080f]/90">
          {/* TAB 1: BIOGRAPHY & LORE */}
          <div className={activeTab === 'bio' ? 'space-y-6 animate-in fade-in duration-200' : 'hidden'}>
            {/* Quote */}
            <div className="relative p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/15 italic text-sm text-amber-200/90 leading-relaxed">
              <Sparkles className="w-4 h-4 text-amber-400 absolute top-3 right-3 opacity-60" />
              {profile.quote}
            </div>

            {/* Character Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.attributes.map((attr) => (
                <div
                  key={attr.label}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-colors"
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    {attr.label}
                  </span>
                  <span className="text-sm font-semibold text-white block mt-0.5">
                    {attr.value}
                  </span>
                  {attr.hint && (
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {attr.hint}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Biography Paragraphs */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                Biography & Craft Philosophy
              </h3>
              {profile.biography.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* LEVEL 05: BLUE FLOWER GARDEN (HIMMEL & FRIEREN) 3D CENTERPIECE */}
            <BlueFlowerGardenViewer />
          </div>

          {/* TAB 2: CHRONICLE & WORK HISTORY */}
          {activeTab === 'chronicle' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                Expeditions & Quests (Experience Timeline)
              </h3>

              <div className="relative border-l-2 border-amber-500/20 ml-3 space-y-6 pl-5 sm:pl-6">
                {profile.chronicle.map((entry, index) => (
                  <div key={index} className="relative group">
                    {/* Glowing Timeline Marker */}
                    <span className="absolute -left-[27px] sm:-left-[31px] top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0c0e1a] shadow-[0_0_8px_#f59e0b]" />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-semibold text-white">
                        {entry.role}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-amber-300 border border-white/10">
                        {entry.period}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      {entry.organization} •{' '}
                      <span className="italic text-slate-400">{entry.realm}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      {entry.summary}
                    </p>

                    {/* Notable Feats */}
                    <div className="mt-3 space-y-1.5">
                      {entry.feats.map((feat, featIdx) => (
                        <div
                          key={featIdx}
                          className="flex items-start gap-2 text-xs text-slate-300"
                        >
                          <span className="text-amber-400 mt-0.5">✦</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIES & EDUCATION */}
          {activeTab === 'academies' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                Mage Academies & Higher Foundations
              </h3>

              <div className="space-y-4">
                {profile.academies.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-amber-500/20 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-semibold text-white">
                        {item.degree}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-amber-300 border border-white/10">
                        {item.period}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/80 font-medium">
                      {item.institution}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ACCOLADES & DISTINCTIONS */}
          {activeTab === 'accolades' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                Seals of Mastery & Certifications
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {profile.accolades.map((accolade, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-colors flex items-start gap-3.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          {accolade.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {accolade.date}
                        </span>
                      </div>
                      <p className="text-xs text-amber-400/80 font-medium mt-0.5">
                        {accolade.issuer}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {accolade.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Parchment Footer */}
        <div className="p-4 bg-gradient-to-r from-amber-950/20 via-black/40 to-amber-950/20 border-t border-amber-500/15 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>THE GRAND MAGE&apos;S ARCHIVE • CODEX OF RECORD</span>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
          >
            DISMISS SCROLL
          </button>
        </div>
      </div>
    </div>
  );
};

