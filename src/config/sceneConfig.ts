export interface CameraConfig {
  initialPosition: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  dampingFactor: number;
}

export interface LightingConfig {
  ambient: {
    color: string;
    intensity: number;
  };
  directional: {
    color: string;
    intensity: number;
    position: [number, number, number];
    shadowBias: number;
    shadowMapSize: number;
  };
  rim: {
    color: string;
    intensity: number;
    position: [number, number, number];
  };
  hemisphere: {
    skyColor: string;
    groundColor: string;
    intensity: number;
  };
}

export interface SceneConfig {
  modelPath: string;
  camera: CameraConfig;
  lighting: LightingConfig;
  fog: {
    color: string;
    near: number;
    far: number;
  };
  modelTransform: {
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number];
  };
  transitionMode?: 'EXPLODED' | 'STAIRCASE';
}

export const SCENE_CONFIG: SceneConfig = {
  // Model file in public/models/home-island.glb
  modelPath: '/models/home-island.glb',

  camera: {
    // Attractive RPG isometric-style starting angle
    initialPosition: [14, 10, 14],
    target: [0, 0.5, 0],
    fov: 45,
    near: 0.1,
    far: 1000,
    minDistance: 5,
    maxDistance: 32,
    minPolarAngle: Math.PI / 8,
    maxPolarAngle: Math.PI / 2.05,
    dampingFactor: 0.05,
  },

  // Permanent Magical Night Lighting
  lighting: {
    ambient: {
      color: '#1e2540',
      intensity: 0.6,
    },
    directional: {
      color: '#a6c5ff', // Silvery moonlight
      intensity: 1.1,
      position: [12, 18, 10],
      shadowBias: -0.0001,
      shadowMapSize: 2048,
    },
    rim: {
      color: '#818cf8', // Indigo/cyan fantasy rim
      intensity: 1.4,
      position: [-12, 8, -12],
    },
    hemisphere: {
      skyColor: '#312e81',
      groundColor: '#0f172a',
      intensity: 0.5,
    },
  },

  // Deep night atmospheric fog
  fog: {
    color: '#0a0c1a',
    near: 25,
    far: 75,
  },

  modelTransform: {
    position: [0, 0, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
  },
  transitionMode: 'EXPLODED',
};
