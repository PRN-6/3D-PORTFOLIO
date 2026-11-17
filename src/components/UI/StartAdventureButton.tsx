import React from 'react';

export interface StartAdventureButtonProps {
  onStartAdventure?: () => void;
}

export const StartAdventureButton: React.FC<StartAdventureButtonProps> = ({
  onStartAdventure,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onStartAdventure) {
      onStartAdventure();
    } else {
      console.log("[Hero's Home] Start Adventure invoked.");
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <button
        onClick={handleClick}
        type="button"
        aria-label="Start Adventure"
        className="bg-black text-white hover:bg-white hover:text-black border border-white/20 hover:border-white px-8 py-3.5 rounded-md text-sm font-semibold tracking-wider uppercase transition-colors duration-300 cursor-pointer select-none active:scale-[0.98]"
      >
        START ADVENTURE
      </button>
    </div>
  );
};
