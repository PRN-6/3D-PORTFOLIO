import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Orbit, Sparkles, X } from 'lucide-react';

interface FunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerOrbit: () => void;
  children: ReactNode;
}

const lore = [
  'Frieren is reading a grimoire containing a spell to turn field flowers into sweet tea.',
  'Fern is quietly watching the campfire, making sure Eisen did not fall asleep with his weapon.',
  'The stone lantern by the house has been glowing for over three centuries.',
  'The Archmage leaves forgotten scrolls on pedestals in the Whispering Forest.',
];

export function FunModal({ isOpen, onClose, onTriggerOrbit, children }: FunModalProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [secret, setSecret] = useState(-1);
  const [sparkles, setSparkles] = useState(false);

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

  useEffect(() => {
    if (!sparkles) return;
    const timer = window.setTimeout(() => setSparkles(false), 1800);
    return () => window.clearTimeout(timer);
  }, [sparkles]);

  // Keep the single portfolio canvas mounted in the same DOM slot on every route.
  return (
    <div className={isOpen ? 'ring-overlay' : 'contents'} role={isOpen ? 'dialog' : undefined}
      aria-modal={isOpen || undefined} aria-labelledby={isOpen ? 'ring-title' : undefined}
      onClick={event => { if (isOpen && event.target === event.currentTarget) onClose(); }}>
      <section className={isOpen ? 'ring-card' : 'contents'}>
        {isOpen && (
          <header className="ring-header">
            <div><p>Frieren &amp; Himmel</p><h1 id="ring-title">Ring at Sundown</h1></div>
            <button ref={closeButton} onClick={onClose} aria-label="Close Fun page"><X /></button>
          </header>
        )}
        <div className={isOpen ? 'ring-stage' : 'contents'}>
          {children}
          {isOpen && sparkles && <div className="ring-sparkles" aria-hidden="true">
            {[16, 28, 41, 53, 64, 76, 87].map((x, i) => <Sparkles key={x}
              style={{ left: x + '%', top: (27 + i * 17 % 50) + '%', animationDelay: i * 0.07 + 's' }} />)}
          </div>}
        </div>
        {isOpen && (
          <div className="ring-tools">
            <div className="ring-caption">
              <span><Orbit size={16} aria-hidden="true" /> Drag to orbit</span>
              <a href="/models/fun/ring-at-sundown.glb" download><Download size={16} /> Download 3D model</a>
            </div>
            <details>
              <summary>More experiments</summary>
              <div className="ring-experiments">
                <button onClick={() => { onTriggerOrbit(); onClose(); }}>Reset island camera</button>
                <button onClick={() => setSparkles(true)}>Starlight sparkle</button>
                <button onClick={() => setSecret(index => (index + 1) % lore.length)}>Reveal campfire secret</button>
              </div>
              {secret >= 0 && <p role="status">{lore[secret]}</p>}
            </details>
          </div>
        )}
      </section>
    </div>
  );
}
