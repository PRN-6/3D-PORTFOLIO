import { useEffect, useRef, type ReactNode } from 'react';
import { Download, Orbit, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerOrbit: () => void;
  battlePaused: boolean;
  onToggleBattle: () => void;
  children: ReactNode;
}

export function FunModal({ isOpen, onClose, onTriggerOrbit, battlePaused, onToggleBattle, children }: FunModalProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    closeButton.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('keydown', escape);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [isOpen, onClose]);

  // Keep the single portfolio canvas mounted in the same DOM slot on every route.
  return (
    <div className={isOpen ? 'ring-overlay' : 'contents'} role={isOpen ? 'dialog' : undefined}
      aria-modal={isOpen || undefined} aria-labelledby={isOpen ? 'ring-title' : undefined}
      onClick={event => { if (isOpen && event.target === event.currentTarget) onClose(); }}>
      <section className={isOpen ? 'ring-card' : 'contents'}>
        {isOpen && (
          <header className="ring-header">
            <div><p>The hero party · A miniature battle</p><h1 id="ring-title">The Scales of Battle</h1></div>
            <button ref={closeButton} onClick={onClose} aria-label="Close Fun page"><X /></button>
          </header>
        )}
        <div className={isOpen ? 'ring-stage' : 'contents'}>
          {children}
        </div>
        {isOpen && (
          <div className="ring-tools">
            <div className="ring-caption">
              <span><Orbit size={16} aria-hidden="true" /> Drag to orbit</span>
              <a href="/models/fun/demon-battle.glb" download><Download size={16} aria-hidden="true" /> Download 3D model</a>
            </div>
            <p className="battle-caption">Frieren casts. Himmel charges. Eisen strikes. Heiter shields the party from the demon’s magic.</p>
            <div className="ring-experiments battle-controls">
              <button onClick={onToggleBattle} disabled={reducedMotion} aria-pressed={battlePaused || reducedMotion}>
                {battlePaused || reducedMotion ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
                {reducedMotion ? 'Motion reduced' : battlePaused ? 'Resume battle' : 'Pause battle'}
              </button>
              <button onClick={onTriggerOrbit}><RotateCcw size={16} aria-hidden="true" /> Reset view</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
