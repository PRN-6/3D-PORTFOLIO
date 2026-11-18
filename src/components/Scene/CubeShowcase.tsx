import React from 'react';
import { ProjectCube } from './ProjectCube';
import { PROJECTS_DATA, type ProjectItem } from '../../data/projectsData';

interface CubeShowcaseProps {
  active: boolean;
  selectedProject: ProjectItem | null;
  onSelectProject: (project: ProjectItem) => void;
  occupiedIndices?: number[];
}

export const CubeShowcase: React.FC<CubeShowcaseProps> = ({
  active,
  selectedProject,
  onSelectProject,
  occupiedIndices = [],
}) => {
  if (!active) return null;

  return (
    <group name="CubeShowcaseGroup" position={[0, 1.2, 0]}>
      {PROJECTS_DATA.map((project, index) => (
        <ProjectCube
          key={project.id}
          project={project}
          index={index}
          isSelected={selectedProject?.id === project.id}
          isAnySelected={selectedProject !== null}
          isOccupied={occupiedIndices.includes(index)}
          onSelect={onSelectProject}
        />
      ))}
    </group>
  );
};

