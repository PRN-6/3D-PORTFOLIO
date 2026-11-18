import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';

/**
 * GitHub SVG Icon
 */
const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

/**
 * LinkedIn SVG Icon
 */
const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

/**
 * Spotify SVG Icon
 */
const SpotifyIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.496 17.306c-.215.353-.675.466-1.028.25-2.825-1.727-6.381-2.116-10.57-1.159-.404.093-.808-.16-.9-.564-.093-.404.16-.807.564-.9 4.584-1.047 8.513-.604 11.685 1.345.353.216.465.675.249 1.028zm1.468-3.262c-.27.44-.848.58-1.288.31-3.235-1.988-8.167-2.56-11.993-1.398-.49.148-1.011-.132-1.16-.622-.148-.49.133-1.011.623-1.16 4.381-1.33 9.813-.69 13.508 1.582.44.27.58.848.31 1.288zm.126-3.414c-3.878-2.302-10.28-2.515-13.987-1.39-.595.181-1.226-.156-1.407-.751-.181-.595.156-1.226.751-1.407 4.257-1.292 11.31-1.043 15.777 1.61.536.318.71 1.015.392 1.551-.318.536-1.015.71-1.526.387z" />
  </svg>
);

interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  isExternal?: boolean;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'GitHub',
    href: 'https://github.com/PRN-6',
    icon: <GithubIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    isExternal: true,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/prins',
    icon: <LinkedinIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    isExternal: true,
  },
  {
    name: 'Email',
    href: 'mailto:prins.engineering@outlook.com',
    icon: <Mail className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    isExternal: false,
  },
  {
    name: 'Spotify',
    href: 'https://open.spotify.com',
    icon: <SpotifyIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
    isExternal: true,
  },
];

/**
 * Hook to manage persistent session-based visitor count
 * Increment once per session; persist across visits via localStorage
 */
function useVisitorCounter(): number {
  const [count, setCount] = useState<number>(1);

  useEffect(() => {
    try {
      const STORAGE_KEY = 'prinson_portfolio_visits';
      const SESSION_KEY = 'prinson_session_active';

      const stored = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      const isNewSession = !sessionStorage.getItem(SESSION_KEY);

      if (isNewSession) {
        const next = stored > 0 ? stored + 1 : 1;
        localStorage.setItem(STORAGE_KEY, next.toString());
        sessionStorage.setItem(SESSION_KEY, 'true');
        setCount(next);
      } else {
        setCount(Math.max(stored, 1));
      }
    } catch {
      setCount(1);
    }
  }, []);

  return count;
}

/**
 * Footer
 *
 * Minimal, elegant fixed bottom footer:
 * - Bottom-Left: GitHub, LinkedIn, Email, Music/Spotify
 * - Bottom-Right: © {year}  •  vis: {visitCount}
 * - pointer-events: none on wrapper, pointer-events: auto on interactive links
 * - 100% stationary during 3D scene interaction and rotation
 */
export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const visitorCount = useVisitorCounter();

  return (
    <footer
      data-testid="portfolio-footer"
      aria-label="Portfolio Footer"
      className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none select-none flex items-center justify-between p-3.5 sm:p-5 md:p-6 pb-[max(0.875rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
    >
      {/* 1. Bottom-Left: Social Icons */}
      <nav
        aria-label="Social Links"
        className="pointer-events-auto flex items-center gap-3.5 sm:gap-4 md:gap-4.5"
      >
        {SOCIAL_LINKS.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target={item.isExternal ? '_blank' : undefined}
            rel={item.isExternal ? 'noopener noreferrer' : undefined}
            aria-label={item.name}
            title={item.name}
            className="group text-zinc-500 hover:text-white transition-all duration-200 cursor-pointer active:scale-95 hover:scale-110 hover:brightness-125 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          >
            {item.icon}
          </a>
        ))}
      </nav>

      {/* 2. Bottom-Right: Copyright and Persistent Visitor Counter */}
      <div
        data-testid="footer-copyright-counter"
        className="pointer-events-auto flex items-center font-mono text-[10px] sm:text-[11px] md:text-xs text-slate-400/80 tracking-wider"
      >
        <span>&copy; {currentYear}</span>
        <span className="mx-1.5 sm:mx-2 text-slate-600 select-none">•</span>
        <span>vis: {visitorCount}</span>
      </div>
    </footer>
  );
};
