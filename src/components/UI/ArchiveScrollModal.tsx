import React, { useState, useEffect } from 'react';
import { X, Scroll, Award, GraduationCap, Briefcase, User, Sparkles } from 'lucide-react';
import { MAGE_PROFILE_DATA } from '../../data/archiveData';
import { BlueFlowerGardenShowcase } from './BlueFlowerGardenShowcase';
import { useTheme } from '../../context/ThemeContext';
import { usePresence } from '../../hooks/usePresence';

export interface ArchiveScrollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'bio' | 'chronicle' | 'academies' | 'accolades';

export const ArchiveScrollModal: React.FC<ArchiveScrollModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('bio');
  const profile = MAGE_PROFILE_DATA;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="The Archmage's Chronicle"
      data-state={presence.state}
    >
      {/* Dimmed backdrop */}
      <div
        data-state={presence.state}
        className="prn-backdrop fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Parchment Scroll Modal Container */}
      <div
        className={`relative z-50 w-full max-w-4xl max-h-[92vh] flex flex-col pointer-events-auto overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-250 select-text ${
          isLight
            ? 'bg-[#f4eee0]/95 text-[#2c2823] border border-[#c8bc9f] shadow-[0_24px_70px_rgba(180,160,130,0.35)]'
            : 'bg-[#0c0e1a]/95 text-slate-200 border border-amber-500/30 shadow-[0_24px_70px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Ornate Header Banner */}
        <div
          className={`relative p-5 sm:p-6 border-b transition-colors ${
            isLight
              ? 'bg-gradient-to-r from-amber-100/60 via-[#eae1cf] to-amber-100/60 border-[#c8bc9f]'
              : 'bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-amber-950/40 border-amber-500/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                  isLight
                    ? 'bg-[#e2d7c2] border border-[#cfc3a9] text-amber-800'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                }`}
              >
                <Scroll className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    className={`font-fantasy text-xl sm:text-2xl font-bold tracking-wide ${
                      isLight ? 'text-[#1c1a17]' : 'text-amber-100'
                    }`}
                  >
                    {profile.name}
                  </h2>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:inline ${
                      isLight
                        ? 'bg-[#e2d7c2] text-amber-900 border border-[#cfc3a9]'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Archmage Codex
                  </span>
                </div>
                <p
                  className={`text-xs sm:text-sm font-medium ${
                    isLight ? 'text-[#5c5446]' : 'text-slate-300'
                  }`}
                >
                  {profile.title}
                </p>
                <p
                  className={`text-[11px] italic mt-0.5 ${
                    isLight ? 'text-amber-800' : 'text-amber-400/80'
                  }`}
                >
                  {profile.epithet}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close chronicle scroll"
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isLight
                  ? 'text-[#5c5446] hover:text-[#1c1a17] hover:bg-black/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation Controls */}
          <div
            className={`flex items-center gap-1 sm:gap-2 mt-5 pt-3 border-t overflow-x-auto no-scrollbar ${
              isLight ? 'border-[#c8bc9f]' : 'border-white/5'
            }`}
          >
            {[
              { id: 'bio' as TabType, label: 'Lore & Bio', icon: User },
              { id: 'chronicle' as TabType, label: 'Chronicle & Feats', icon: Briefcase },
              { id: 'academies' as TabType, label: 'Academies', icon: GraduationCap },
              { id: 'accolades' as TabType, label: 'Accolades', icon: Award },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-[#1c1a17] text-[#f4eee0] shadow-sm'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : isLight
                      ? 'text-[#6a6050] hover:text-[#1c1a17] hover:bg-black/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Parchment Content Body */}
        <div
          className={`flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6 custom-scrollbar ${
            isLight
              ? 'bg-[#f4eee0]'
              : 'bg-gradient-to-b from-transparent via-[#090b14]/50 to-[#07080f]/90'
          }`}
        >
          {/* TAB 1: BIOGRAPHY & LORE */}
          <div className={activeTab === 'bio' ? 'space-y-6 animate-in fade-in duration-200' : 'hidden'}>
            {/* Quote */}
            <div
              className={`relative p-4 rounded-xl italic text-sm leading-relaxed ${
                isLight
                  ? 'bg-[#eae1cf] border border-[#cfc3a9] text-[#3d372e]'
                  : 'bg-amber-500/[0.04] border border-amber-500/15 text-amber-200/90'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 absolute top-3 right-3 opacity-60 ${
                  isLight ? 'text-amber-700' : 'text-amber-400'
                }`}
              />
              {profile.quote}
            </div>

            {/* Character Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.attributes.map((attr) => (
                <div
                  key={attr.label}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-[#eae1cf] border-[#cfc3a9] hover:border-[#b8aa8e]'
                      : 'bg-white/[0.02] border-white/5 hover:border-amber-500/20'
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider block ${
                      isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
                    }`}
                  >
                    {attr.label}
                  </span>
                  <span
                    className={`text-sm font-semibold block mt-0.5 ${
                      isLight ? 'text-[#1c1a17]' : 'text-white'
                    }`}
                  >
                    {attr.value}
                  </span>
                  {attr.hint && (
                    <span
                      className={`text-[11px] block mt-1 ${
                        isLight ? 'text-[#5c5446]' : 'text-slate-400'
                      }`}
                    >
                      {attr.hint}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Biography Paragraphs */}
            <div className="space-y-3 pt-2">
              <h3
                className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                  isLight ? 'text-amber-900 font-bold' : 'text-amber-400'
                }`}
              >
                Biography &amp; Craft Philosophy
              </h3>
              {profile.biography.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isLight ? 'text-[#3d372e]' : 'text-slate-300'
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* LEVEL 05: BLUE FLOWER GARDEN (HIMMEL & FRIEREN) 2D SHOWCASE */}
            <BlueFlowerGardenShowcase />
          </div>

          {/* TAB 2: CHRONICLE & WORK HISTORY */}
          {activeTab === 'chronicle' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3
                className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                  isLight ? 'text-amber-900 font-bold' : 'text-amber-400'
                }`}
              >
                Expeditions &amp; Quests (Experience Timeline)
              </h3>

              <div
                className={`relative border-l-2 ml-3 space-y-6 pl-5 sm:pl-6 ${
                  isLight ? 'border-[#cfc3a9]' : 'border-amber-500/20'
                }`}
              >
                {profile.chronicle.map((entry, index) => (
                  <div key={index} className="relative group">
                    {/* Timeline Marker */}
                    <span
                      className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-3 h-3 rounded-full ${
                        isLight
                          ? 'bg-amber-600 border-2 border-[#f4eee0] shadow-sm'
                          : 'bg-amber-400 border-2 border-[#0c0e1a] shadow-[0_0_8px_#f59e0b]'
                      }`}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4
                        className={`text-sm sm:text-base font-semibold ${
                          isLight ? 'text-[#1c1a17]' : 'text-white'
                        }`}
                      >
                        {entry.role}
                      </h4>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                          isLight
                            ? 'bg-[#e2d7c2] text-[#4d4436] border-[#cfc3a9]'
                            : 'bg-white/5 text-amber-300 border border-white/10'
                        }`}
                      >
                        {entry.period}
                      </span>
                    </div>

                    <div
                      className={`text-xs font-medium mt-0.5 ${
                        isLight ? 'text-[#5c5446]' : 'text-slate-400'
                      }`}
                    >
                      {entry.organization} •{' '}
                      <span className={`italic ${isLight ? 'text-[#7a6f5d]' : 'text-slate-400'}`}>
                        {entry.realm}
                      </span>
                    </div>

                    <p
                      className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                        isLight ? 'text-[#3d372e]' : 'text-slate-300'
                      }`}
                    >
                      {entry.summary}
                    </p>

                    {/* Notable Feats */}
                    <div className="mt-3 space-y-1.5">
                      {entry.feats.map((feat, featIdx) => (
                        <div
                          key={featIdx}
                          className={`flex items-start gap-2 text-xs ${
                            isLight ? 'text-[#3d372e]' : 'text-slate-300'
                          }`}
                        >
                          <span className={`mt-0.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                            ✦
                          </span>
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
              <h3
                className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                  isLight ? 'text-amber-900 font-bold' : 'text-amber-400'
                }`}
              >
                Mage Academies &amp; Higher Foundations
              </h3>

              <div className="space-y-4">
                {profile.academies.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 sm:p-5 rounded-xl border space-y-2 transition-colors ${
                      isLight
                        ? 'bg-[#eae1cf] border-[#cfc3a9] hover:border-[#b8aa8e]'
                        : 'bg-white/[0.02] border-white/5 hover:border-amber-500/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4
                        className={`text-sm sm:text-base font-semibold ${
                          isLight ? 'text-[#1c1a17]' : 'text-white'
                        }`}
                      >
                        {item.degree}
                      </h4>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                          isLight
                            ? 'bg-[#e2d7c2] text-[#4d4436] border-[#cfc3a9]'
                            : 'bg-white/5 text-amber-300 border border-white/10'
                        }`}
                      >
                        {item.period}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-medium ${
                        isLight ? 'text-amber-900' : 'text-amber-200/80'
                      }`}
                    >
                      {item.institution}
                    </p>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isLight ? 'text-[#3d372e]' : 'text-slate-300'
                      }`}
                    >
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
              <h3
                className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                  isLight ? 'text-amber-900 font-bold' : 'text-amber-400'
                }`}
              >
                Seals of Mastery &amp; Certifications
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {profile.accolades.map((accolade, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-colors flex items-start gap-3.5 ${
                      isLight
                        ? 'bg-[#eae1cf] border-[#cfc3a9] hover:border-[#b8aa8e]'
                        : 'bg-white/[0.02] border-white/5 hover:border-amber-500/20'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isLight
                          ? 'bg-[#e2d7c2] border border-[#cfc3a9] text-amber-800'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm font-semibold ${
                            isLight ? 'text-[#1c1a17]' : 'text-white'
                          }`}
                        >
                          {accolade.name}
                        </h4>
                        <span
                          className={`text-[10px] font-mono shrink-0 ${
                            isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
                          }`}
                        >
                          {accolade.date}
                        </span>
                      </div>
                      <p
                        className={`text-xs font-medium mt-0.5 ${
                          isLight ? 'text-amber-900' : 'text-amber-400/80'
                        }`}
                      >
                        {accolade.issuer}
                      </p>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${
                          isLight ? 'text-[#5c5446]' : 'text-slate-400'
                        }`}
                      >
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
        <div
          className={`p-4 border-t flex items-center justify-between text-[11px] font-mono ${
            isLight
              ? 'bg-[#eae1cf] border-[#cfc3a9] text-[#7a6f5d]'
              : 'bg-gradient-to-r from-amber-950/20 via-black/40 to-amber-950/20 border-amber-500/15 text-slate-400'
          }`}
        >
          <span>THE GRAND MAGE&apos;S ARCHIVE • CODEX OF RECORD</span>
          <button
            type="button"
            onClick={onClose}
            className={`font-semibold cursor-pointer transition-colors ${
              isLight
                ? 'text-[#1c1a17] hover:text-amber-900'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            DISMISS SCROLL
          </button>
        </div>
      </div>
    </div>
  );
};
