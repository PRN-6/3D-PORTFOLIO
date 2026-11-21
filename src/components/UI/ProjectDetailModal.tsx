import React, { useEffect } from 'react';
import { X, ExternalLink, Terminal } from 'lucide-react';
import type { ProjectItem } from '../../data/projectsData';
import { useTheme } from '../../context/ThemeContext';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
}) => {
  const { isLight } = useTheme();

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
      <div
        className={`relative flex flex-col h-full overflow-hidden rounded-2xl backdrop-blur-xl ${
          isLight
            ? 'bg-[#f4eee0]/95 border border-[#c8bc9f] text-[#2c2823] shadow-[0_16px_40px_rgba(180,160,130,0.35)]'
            : 'bg-[#090b14]/85 border border-white/10 text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Accent Edge Top Highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: project.accentColor }}
        />

        {/* Modal Header */}
        <div
          className={`flex items-center justify-between p-5 pb-3 border-b ${
            isLight ? 'border-[#c8bc9f]' : 'border-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: project.accentColor, boxShadow: `0 0 8px ${project.accentColor}` }}
            />
            <span
              className={`text-[11px] font-mono tracking-widest uppercase ${
                isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
              }`}
            >
              {project.category}
            </span>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close project modal"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-[#5c5446] hover:text-[#1c1a17] hover:bg-black/5'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {/* Title and Tagline */}
          <div>
            <h2
              className={`font-fantasy text-xl sm:text-2xl font-bold tracking-wider ${
                isLight ? 'text-[#1c1a17]' : 'text-white'
              }`}
            >
              {project.title}
            </h2>
            <p
              className={`text-xs sm:text-sm mt-1 font-medium leading-relaxed ${
                isLight ? 'text-[#5c5446]' : 'text-slate-400'
              }`}
            >
              {project.tagline}
            </p>
          </div>

          {/* Minimal 3D Preview Frame */}
          <div
            className={`relative w-full h-32 rounded-xl border flex flex-col items-center justify-center p-4 overflow-hidden group ${
              isLight
                ? 'bg-[#e2d7c2] border-[#cfc3a9]'
                : 'bg-gradient-to-br from-[#0e1222] to-[#080911] border-white/5'
            }`}
          >
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, ${project.accentColor} 0%, transparent 70%)`,
              }}
            />
            <Terminal
              className={`w-8 h-8 mb-2 transition-transform group-hover:scale-110 duration-300 ${
                isLight ? 'text-[#7a6f5d]' : 'text-slate-500'
              }`}
            />
            <div
              className={`text-[11px] font-mono tracking-wider ${
                isLight ? 'text-[#5c5446]' : 'text-slate-400'
              }`}
            >
              INSPECTING 3D CUBE IN REALM
            </div>
            <div
              className={`mt-1 text-[10px] uppercase font-semibold tracking-widest px-2.5 py-0.5 rounded-full border ${
                isLight ? 'border-[#cfc3a9]' : 'border-white/10'
              }`}
              style={{ color: project.accentColor, borderColor: `${project.accentColor}40` }}
            >
              Interactive Cube Active
            </div>
          </div>

          {/* Overview */}
          <div>
            <h3
              className={`text-xs font-mono uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
              }`}
            >
              Overview
            </h3>
            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isLight ? 'text-[#3d372e]' : 'text-slate-200'
              }`}
            >
              {project.description}
            </p>
          </div>

          {/* Architecture & Details */}
          <div>
            <h3
              className={`text-xs font-mono uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
              }`}
            >
              Architecture & Highlights
            </h3>
            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isLight ? 'text-[#3d372e]' : 'text-slate-300'
              }`}
            >
              {project.details}
            </p>
          </div>

          {/* Technologies Used */}
          <div>
            <h3
              className={`text-xs font-mono uppercase tracking-wider mb-2 ${
                isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
              }`}
            >
              Technologies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-md border ${
                    isLight
                      ? 'bg-[#eae1cf] text-[#3d372e] border-[#cfc3a9]'
                      : 'bg-white/[0.04] text-slate-300 border border-white/10'
                  }`}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center gap-3 ${
            isLight
              ? 'border-[#c8bc9f] bg-[#eae1cf]'
              : 'border-white/5 bg-[#07080f]/90'
          }`}
        >
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-colors text-xs font-bold tracking-wide uppercase cursor-pointer ${
              isLight
                ? 'bg-[#1c1a17] text-[#f4eee0] hover:bg-[#332e26]'
                : 'bg-white text-black hover:bg-slate-200'
            }`}
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
              className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl transition-colors text-xs font-semibold tracking-wide uppercase border cursor-pointer ${
                isLight
                  ? 'bg-[#d8cbb2] text-[#1c1a17] hover:bg-[#cfc3a9] border-[#c8bc9f]'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
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
