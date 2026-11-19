import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'desktop', className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'mobile') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        data-testid="theme-toggle-mobile"
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`pointer-events-auto group flex items-center justify-center active:scale-95 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-lg select-none ${
          isDark
            ? 'bg-black/80 text-zinc-400 hover:text-amber-300 border border-white/10'
            : 'bg-[#e6decb]/95 text-[#2b2723] hover:text-amber-700 border border-[#c8bc9f]'
        } ${className}`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-300/90 transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-800 transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </div>
      </button>
    );
  }

  // Desktop variant
  return (
    <button
      onClick={toggleTheme}
      type="button"
      data-testid="theme-toggle"
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`group flex items-center gap-1.5 transition-colors duration-200 font-mono text-xs cursor-pointer select-none ${
        isDark
          ? 'text-zinc-500 hover:text-amber-300'
          : 'text-[#5c5446] hover:text-[#1c1a17]'
      } ${className}`}
    >
      <div className="relative w-3.5 h-3.5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-300 transition-all duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-[#5c5446] group-hover:text-[#1c1a17] transition-all duration-300 group-hover:-rotate-12" />
        )}
      </div>
      <span className="lowercase">{theme}</span>
    </button>
  );
};

