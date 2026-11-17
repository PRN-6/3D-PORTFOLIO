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
}

export const SCENE_CONFIG: SceneConfig = {
  // Model file expected in public/models/home-island.glb
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
    minPolarAngle: Math.PI / 8, // ~22.5 deg from top
    maxPolarAngle: Math.PI / 2.05, // keeps camera slightly above underside
    dampingFactor: 0.05,
  },

  lighting: {
    ambient: {
      color: '#e0f2fe',
      intensity: 0.75,
    },
    directional: {
      color: '#fff7ea',
      intensity: 2.4,
      position: [14, 20, 12],
      shadowBias: -0.0001,
      shadowMapSize: 2048,
    },
    rim: {
      color: '#bae6fd',
      intensity: 0.95,
      position: [-12, 8, -12],
    },
    hemisphere: {
      skyColor: '#93c5fd',
      groundColor: '#4ade80',
      intensity: 0.6,
    },
  },

  fog: {
    color: '#93c5fd',
    near: 35,
    far: 95,
  },

  modelTransform: {
    position: [0, 0, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
  },
};
