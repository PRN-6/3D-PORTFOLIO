import React, { useEffect } from 'react';
import { X, ExternalLink, GitBranch, Code, Compass } from 'lucide-react';
import { PROJECTS_DATA, type ProjectItem } from '../../data/projectsData';
import { useTheme } from '../../context/ThemeContext';

export interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWorkshop?: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToWorkshop,
}) => {
  const { isLight } = useTheme();

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
      aria-labelledby="projects-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl animate-in zoom-in-95 duration-200 select-text overflow-hidden ${
          isLight
            ? 'bg-[#f4eee0]/95 border border-[#c8bc9f] text-[#2c2823] shadow-[0_20px_60px_rgba(180,160,130,0.35)]'
            : 'bg-[#090b14]/95 border border-white/15 text-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Modal Header */}
        <div
          className={`p-5 sm:p-6 pb-4 border-b flex items-start justify-between gap-4 ${
            isLight ? 'border-[#c8bc9f]' : 'border-white/10'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span
                className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${
                  isLight ? 'text-cyan-700' : 'text-cyan-300'
                }`}
              >
                Engineering & Creations
              </span>
            </div>
            <h2
              id="projects-modal-title"
              className={`text-2xl font-bold tracking-wide font-fantasy ${
                isLight ? 'text-[#1c1a17]' : 'text-white'
              }`}
            >
              Projects
            </h2>
            <p
              className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                isLight ? 'text-[#5c5446]' : 'text-slate-400'
              }`}
            >
              A curated catalog of software architecture, intelligent systems, and interactive applications.
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close Projects Modal"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'text-[#5c5446] hover:text-[#1c1a17] hover:bg-black/5'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Project Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECTS_DATA.map((project: ProjectItem) => (
              <div
                key={project.id}
                className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
                  isLight
                    ? 'bg-[#eae1cf] hover:bg-[#e2d7c2] border-[#cfc3a9] hover:border-[#b8a688] shadow-sm'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-cyan-500/40'
                }`}
              >
                <div>
                  {/* Category Pill & Title */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isLight
                          ? 'text-cyan-800 bg-cyan-100/80 border-cyan-300'
                          : 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
                      }`}
                    >
                      {project.category}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        isLight ? 'text-[#847966]' : 'text-slate-500'
                      }`}
                    >
                      #{project.id}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-semibold mb-2 transition-colors ${
                      isLight
                        ? 'text-[#1c1a17] group-hover:text-[#0c0a08]'
                        : 'text-white group-hover:text-cyan-200'
                    }`}
                  >
                    {project.title}
                  </h3>

                  <p
                    className={`text-xs leading-relaxed mb-4 ${
                      isLight ? 'text-[#4a4336]' : 'text-slate-400'
                    }`}
                  >
                    {project.description}
                  </p>
                </div>

                <div>
                  {/* Technology Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isLight
                            ? 'text-[#2b2723] bg-[#ded3bd] border-[#cfc3a9]'
                            : 'text-slate-300 bg-black/40 border-white/10'
                        }`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div
                    className={`flex items-center gap-2 pt-2 border-t ${
                      isLight ? 'border-[#cfc3a9]' : 'border-white/5'
                    }`}
                  >
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'text-[#2b2723] hover:text-black bg-[#ded3bd]/80 hover:bg-[#d5c9b1] border-[#cfc3a9]'
                            : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {project.liveDemoUrl && (
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'text-cyan-900 hover:text-cyan-950 bg-cyan-200/70 hover:bg-cyan-200 border-cyan-400/60 font-medium'
                            : 'text-cyan-300 hover:text-cyan-100 bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-500/30'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer with 3D Workshop Shortcut */}
        <div
          className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight
              ? 'bg-[#e2d7c2] border-[#c8bc9f] text-[#4a4336]'
              : 'bg-black/40 border-white/10 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-500" />
            <span>{PROJECTS_DATA.length} verified projects loaded</span>
          </div>

          {onNavigateToWorkshop && (
            <button
              onClick={() => {
                onClose();
                onNavigateToWorkshop();
              }}
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium tracking-wide transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-[#1c1a17] text-[#f4eee0] border-[#38332c] hover:bg-[#2b2723]'
                  : 'text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900 border-cyan-500/40 hover:border-cyan-400'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Visit Rune Workshop (3D Island)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
