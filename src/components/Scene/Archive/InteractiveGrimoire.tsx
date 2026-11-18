import React from 'react';
import { ArchiveGrimoires, type ArchiveGrimoiresProps } from './ArchiveGrimoires';
import type { GrimoireItem } from '../../../data/archiveData';

export interface InteractiveGrimoireProps {
  grimoire: GrimoireItem;
  isSelected: boolean;
  onSelect: (grimoire: GrimoireItem) => void;
}

/**
 * Re-exporting ArchiveGrimoires for backward compatibility with modular grimoire imports
 */
export const InteractiveGrimoire: React.FC<InteractiveGrimoireProps> = ({
  grimoire,
  isSelected,
  onSelect,
}) => {
  return (
    <ArchiveGrimoires
      selectedGrimoire={isSelected ? grimoire : null}
      onSelectGrimoire={onSelect}
    />
  );
};

export { ArchiveGrimoires };
export type { ArchiveGrimoiresProps };
