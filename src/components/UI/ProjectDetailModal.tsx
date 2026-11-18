import React, { useEffect } from 'react';
import { X, ExternalLink, Terminal } from 'lucide-react';
import type { ProjectItem } from '../../data/projectsData';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  return (
    <aside
      aria-label="Project Details"
      className="fixed z-40 top-4 bottom-4 right-4 sm:top-8 sm:bottom-8 sm:right-8 w-full max-w-[92vw] sm:max-w-[480px] flex flex-col pointer-events-auto select-text animate-in fade-in slide-in-from-right-6 duration-300"
    >
      <div className="relative flex flex-col h-full overflow-hidden rounded-2xl bg-[#090b14]/85 backdrop-blur-xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
        {/* Accent Edge Top Highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: project.accentColor }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: project.accentColor, boxShadow: `0 0 8px ${project.accentColor}` }}
            />
            <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
              {project.category}
            </span>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close project modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {/* Title and Tagline */}
          <div>
            <h2 className="font-fantasy text-xl sm:text-2xl font-bold text-white tracking-wider">
              {project.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium leading-relaxed">
              {project.tagline}
            </p>
          </div>

          {/* Minimal 3D Preview Frame */}
          <div className="relative w-full h-32 rounded-xl bg-gradient-to-br from-[#0e1222] to-[#080911] border border-white/5 flex flex-col items-center justify-center p-4 overflow-hidden group">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, ${project.accentColor} 0%, transparent 70%)`,
              }}
            />
            <Terminal className="w-8 h-8 text-slate-500 mb-2 transition-transform group-hover:scale-110 duration-300" />
            <div className="text-[11px] font-mono text-slate-400 tracking-wider">
              INSPECTING 3D CUBE IN REALM
            </div>
            <div
              className="mt-1 text-[10px] uppercase font-semibold tracking-widest px-2.5 py-0.5 rounded-full border border-white/10"
              style={{ color: project.accentColor, borderColor: `${project.accentColor}40` }}
            >
              Interactive Cube Active
            </div>
          </div>

          {/* Overview */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Architecture & Details */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Architecture & Highlights
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {project.details}
            </p>
          </div>

          {/* Technologies Used */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Technologies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-md bg-white/[0.04] text-slate-300 border border-white/10"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-[#07080f]/90 flex items-center gap-3">
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black hover:bg-slate-200 transition-colors text-xs font-bold tracking-wide uppercase cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>View Source</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-60" />
          </a>

          {project.liveDemoUrl && (
            <a
              href={project.liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-xs font-semibold tracking-wide uppercase border border-white/10 cursor-pointer"
            >
              <span>Demo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </aside>
  );
};
