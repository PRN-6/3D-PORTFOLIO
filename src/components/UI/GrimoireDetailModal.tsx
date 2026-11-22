import React from 'react';
import { type GrimoireItem } from '../../data/archiveData';

export interface GrimoireDetailModalProps {
  grimoire: GrimoireItem | null;
  onClose: () => void;
  onSelectGrimoire?: (grimoire: GrimoireItem) => void;
}

/**
 * GrimoireDetailModal
 * Close button removed per user request so users navigate seamlessly via Navbar
 */
export const GrimoireDetailModal: React.FC<GrimoireDetailModalProps> = () => null;

