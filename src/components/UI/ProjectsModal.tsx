import React, { useEffect } from 'react';
import { X, ExternalLink, GitBranch, Code, Compass } from 'lucide-react';
import { PROJECTS_DATA, type ProjectItem } from '../../data/projectsData';

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
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#090b14]/95 border border-white/15 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-200 select-text overflow-hidden"
      >
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">
                Engineering & Creations
              </span>
            </div>
            <h2
              id="projects-modal-title"
              className="text-2xl font-bold text-white tracking-wide font-fantasy"
            >
              Projects
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              A curated catalog of software architecture, intelligent systems, and interactive applications.
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close Projects Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
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
                className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-500/40 transition-all duration-200"
              >
                <div>
                  {/* Category Pill & Title */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                      {project.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      #{project.id}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white group-hover:text-cyan-200 transition-colors mb-2">
                    {project.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div>
                  {/* Technology Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono text-slate-300 bg-black/40 border border-white/10 px-2 py-0.5 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}
                    {project.liveDemoUrl && (
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-100 bg-cyan-950/40 hover:bg-cyan-900/50 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-colors"
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
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>{PROJECTS_DATA.length} verified projects loaded</span>
          </div>

          {onNavigateToWorkshop && (
            <button
              onClick={() => {
                onClose();
                onNavigateToWorkshop();
              }}
              type="button"
              className="inline-flex items-center gap-2 text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 hover:border-cyan-400 px-3.5 py-1.5 rounded-lg font-medium tracking-wide transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Visit Rune Workshop (3D Island)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
