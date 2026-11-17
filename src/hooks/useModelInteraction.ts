import { useState, useCallback } from 'react';
import type * as THREE from 'three';

export interface InteractedObject {
  name: string;
  point?: THREE.Vector3;
}

export function useModelInteraction() {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<InteractedObject | null>(null);

  const handleHover = useCallback((name: string | null) => {
    setHoveredObject(name);
  }, []);

  const handleSelect = useCallback((name: string, point?: THREE.Vector3) => {
    setSelectedObject({ name, point });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedObject(null);
  }, []);

  return {
    hoveredObject,
    selectedObject,
    handleHover,
    handleSelect,
    clearSelection,
  };
}

