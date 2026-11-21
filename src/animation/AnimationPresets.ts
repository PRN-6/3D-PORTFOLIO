export type PresetKey = 'PAPERCRAFT' | 'SPIRAL' | 'SMOOTH' | 'DRAMATIC' | 'MINIMAL';

export interface AnimationPreset {
  key: PresetKey;
  name: string;
  tagline: string;
  description: string;
  duration: number; // Duration in seconds for full assembly
  disassemblyDuration: number; // Duration in seconds for full disassembly
  spiralRadiusMultiplier: number;
  spiralTurns: number;
  liftArcHeight: number;
  spinRate: number;
  squashStretch: {
    enabled: boolean;
    amplitude: number; // Max squash deformation ratio (e.g. 0.12 = 12%)
    frequency: number; // Oscillation cycles during settle
    damping: number; // Exponential decay rate
    arrivalWindow: number; // Normalized tail window for bounce (e.g. 0.20 = last 20% of flight)
  };
  staggerSpread: number; // Layer stagger distribution exponent
}

export const ANIMATION_PRESETS: Record<PresetKey, AnimationPreset> = {
  PAPERCRAFT: {
    key: 'PAPERCRAFT',
    name: 'Papercraft Pop-Up',
    tagline: 'Handcrafted Pop-Up Book Flaps',
    description: 'Floor emergence, bottom-edge wall folding, base-pivot furniture pop-up, and cascading domino details.',
    duration: 2.4,
    disassemblyDuration: 2.0,
    spiralRadiusMultiplier: 0.2,
    spiralTurns: 0.0,
    liftArcHeight: 0.8,
    spinRate: 0.0,
    squashStretch: {
      enabled: true,
      amplitude: 0.08,
      frequency: 14.0,
      damping: 6.5,
      arrivalWindow: 0.16,
    },
    staggerSpread: 1.0,
  },
  SPIRAL: {
    key: 'SPIRAL',
    name: 'Spiral Assembly',
    tagline: 'Viscous Realm Level 3 Pro Style',
    description: 'Dynamic inward spiral trajectories with orbital tumble and tactile squash & stretch arrival settling.',
    duration: 6.5,
    disassemblyDuration: 4.8,
    spiralRadiusMultiplier: 1.4,
    spiralTurns: 1.75,
    liftArcHeight: 4.2,
    spinRate: 2.2,
    squashStretch: {
      enabled: true,
      amplitude: 0.11,
      frequency: 18.0,
      damping: 5.8,
      arrivalWindow: 0.18,
    },
    staggerSpread: 1.0,
  },
  SMOOTH: {
    key: 'SMOOTH',
    name: 'Smooth Assembly',
    tagline: 'Graceful Flowing Arcs',
    description: 'Elegant curved trajectories with cubic easing and gentle landing deceleration.',
    duration: 5.2,
    disassemblyDuration: 4.2,
    spiralRadiusMultiplier: 0.75,
    spiralTurns: 0.65,
    liftArcHeight: 2.8,
    spinRate: 1.2,
    squashStretch: {
      enabled: true,
      amplitude: 0.05,
      frequency: 14.0,
      damping: 7.2,
      arrivalWindow: 0.14,
    },
    staggerSpread: 0.9,
  },
  DRAMATIC: {
    key: 'DRAMATIC',
    name: 'Dramatic Explosion',
    tagline: 'Cinematic High-Velocity Impact',
    description: 'Expansive radial dispersal, high orbital velocity, and snappy energetic snap.',
    duration: 4.2,
    disassemblyDuration: 3.5,
    spiralRadiusMultiplier: 2.2,
    spiralTurns: 2.5,
    liftArcHeight: 6.5,
    spinRate: 3.5,
    squashStretch: {
      enabled: true,
      amplitude: 0.16,
      frequency: 22.0,
      damping: 4.5,
      arrivalWindow: 0.22,
    },
    staggerSpread: 1.15,
  },
  MINIMAL: {
    key: 'MINIMAL',
    name: 'Minimal Assembly',
    tagline: 'Precision Architectural Reveal',
    description: 'Understated, subtle assembly with minimal trajectory deviation and crisp docking.',
    duration: 3.2,
    disassemblyDuration: 2.8,
    spiralRadiusMultiplier: 0.35,
    spiralTurns: 0.2,
    liftArcHeight: 1.2,
    spinRate: 0.5,
    squashStretch: {
      enabled: false,
      amplitude: 0.02,
      frequency: 12.0,
      damping: 9.0,
      arrivalWindow: 0.10,
    },
    staggerSpread: 0.7,
  },
};

