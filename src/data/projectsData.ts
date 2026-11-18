export interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  description: string;
  details: string;
  technologies: string[];
  githubUrl: string;
  liveDemoUrl?: string;
  accentColor: string;
  position: [number, number, number];
  size: number;
  rotationSpeed: [number, number, number];
}

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'privacy68',
    title: 'PRIVACY68',
    tagline: 'Autonomous 100% Local Voice Assistant & OS Automation',
    category: 'AI & Autonomous Systems',
    description:
      'Autonomous, 100% local voice assistant and OS automation engine for Windows powered by faster-whisper, Silero VAD, CAM++ voice biometric lock, MediaPipe gestures, and Ollama.',
    details:
      'Engineered with zero cloud dependencies and strict local privacy. Features real-time offline speech recognition, voiceprint biometric speaker identification, vision-based hand gesture controls, and surgical Windows API desktop automation.',
    technologies: [
      'Python',
      'faster-whisper',
      'Silero VAD',
      'Ollama',
      'MediaPipe',
      'PyTorch',
      'Windows API',
    ],
    githubUrl: 'https://github.com/PRN-6/PRIVACY68',
    accentColor: '#38bdf8', // Electric Sky
    position: [-4.2, 2.8, 1.8],
    size: 1.55,
    rotationSpeed: [0.12, 0.22, 0.08],
  },
  {
    id: 'cubix68',
    title: 'CUBIX68',
    tagline: 'Interactive Twisty-Puzzle Scanning & Solving Platform',
    category: 'Web & 3D Interactive',
    description:
      'Complete interactive twisty-puzzle laboratory featuring real-time webcam camera scanning, mathematical validation, and pedagogical step-by-step 3D solver.',
    details:
      'Includes real-time camera scanning using CIELAB perceptual color distance, mathematical parity verification (Corner Twist, Edge Flip, Permutation Parity), and multi-method solvers including CFOP, Kociemba Two-Phase in <5ms, and IDA* God’s Algorithm.',
    technologies: [
      'TypeScript',
      'Three.js',
      'React Three Fiber',
      'Webcam API',
      'Algorithms',
      'Vite',
    ],
    githubUrl: 'https://github.com/PRN-6/cube68',
    accentColor: '#10b981', // Emerald
    position: [-1.8, 4.4, -1.2],
    size: 1.6,
    rotationSpeed: [0.15, -0.18, 0.1],
  },
  {
    id: 'code68',
    title: 'code68',
    tagline: 'Autonomous Terminal AI Coding Agent',
    category: 'Developer Tools',
    description:
      'Autonomous terminal AI coding agent blending cloud intelligence with local execution, surgical AST diff editing, and test-driven self-repair.',
    details:
      'Runs directly in the command line with surgical diff patching, abstract syntax tree codebase semantic search, automated unit-test loops, and a 5-tier security sandbox for safe automated development.',
    technologies: [
      'Node.js',
      'TypeScript',
      'LLM APIs',
      'AST Parser',
      'CLI',
      'Testing',
    ],
    githubUrl: 'https://github.com/PRN-6/code68',
    accentColor: '#f43f5e', // Crimson Rose
    position: [1.8, 4.6, -1.5],
    size: 1.5,
    rotationSpeed: [-0.14, 0.2, 0.12],
  },
  {
    id: 'swarm66',
    title: 'swarm66',
    tagline: 'Autonomous AI Cursor Swarm DOM Reconstructor',
    category: 'Simulations & AI',
    description:
      'Autonomous AI cursor swarm that reverse-engineers any webpage DOM and reconstructs the UI live in real time using Reynolds Boids flocking physics.',
    details:
      'Zero external runtime dependencies. Simulates hundreds of autonomous cursor agents implementing separation, alignment, and cohesion physics to deconstruct and rebuild interactive web components live.',
    technologies: [
      'JavaScript',
      'Boids Physics',
      'DOM API',
      'Generative UI',
      'Canvas',
    ],
    githubUrl: 'https://github.com/PRN-6/swarm66',
    accentColor: '#a855f7', // Cosmic Purple
    position: [4.4, 2.6, 1.4],
    size: 1.55,
    rotationSpeed: [0.18, 0.14, -0.09],
  },
  {
    id: 'harry-potter-3d',
    title: 'Harry Potter 3D',
    tagline: 'Interactive Procedural 3D Great Hall Experience',
    category: 'Web & 3D Interactive',
    description:
      'Harry Potter themed university festival site with a fully procedural 3D Great Hall, floating candle arrays, and interactive spell casting mechanics.',
    details:
      'Features custom GLSL flame and stone shaders, volumetric point lighting, procedural candle physics, smooth camera flythroughs, and interactive house sorting experiences.',
    technologies: [
      'React',
      'React Three Fiber',
      'Three.js',
      'GLSL Shaders',
      'Tailwind CSS',
    ],
    githubUrl: 'https://github.com/PRN-6/harry-potter-3D-website',
    accentColor: '#eab308', // Amber Gold
    position: [-3.6, 0.2, 3.2],
    size: 1.4,
    rotationSpeed: [-0.1, 0.16, 0.14],
  },
  {
    id: 'programmer66',
    title: 'programmer66',
    tagline: '3D Agricultural Drone Simulator & Python Arena',
    category: 'Simulations & Games',
    description:
      'Autonomous 3D agricultural drone simulator with an in-browser Python automation runtime (Pyodide) and real-time multiplayer coding tournament platform.',
    details:
      'Enables developers to program automated drone flight paths and crop-harvesting routines in Python directly in the browser, featuring multiplayer WebSocket lobbies and live telemetry.',
    technologies: [
      'Three.js',
      'Pyodide',
      'Python',
      'WebSockets',
      'React',
    ],
    githubUrl: 'https://github.com/PRN-6/programmer66',
    accentColor: '#06b6d4', // Cyan
    position: [0.2, -0.4, 3.8],
    size: 1.45,
    rotationSpeed: [0.16, -0.12, 0.15],
  },
  {
    id: 'web68',
    title: 'web68',
    tagline: 'Zero-Config Multi-Language AST Visualizer',
    category: 'Developer Tools',
    description:
      'Zero-config multi-language AST visualizer (TS, JS, Python) with native RFC 6455 WebSocket hot reload and organic force-decay physics.',
    details:
      'Instant npx command line execution that parses code into interactive force-directed node graphs, visualizing complex syntax trees, import dependencies, and structural relationships live.',
    technologies: [
      'TypeScript',
      'Node.js',
      'WebSocket',
      'AST Parsers',
      'Physics Engine',
    ],
    githubUrl: 'https://github.com/PRN-6/web66',
    accentColor: '#6366f1', // Indigo
    position: [3.8, 0.4, 3.0],
    size: 1.35,
    rotationSpeed: [0.11, 0.19, -0.13],
  },
  {
    id: 'phonespace66',
    title: 'phone-space66',
    tagline: 'Android-to-Windows Virtual Desktop Integration',
    category: 'Desktop & Systems',
    description:
      'Android-to-Windows virtual desktop integration platform with storage exploration, low-latency screen mirroring, and cross-device input bridging.',
    details:
      'Direct ADB protocol integration, low-latency wireless H.264 video streaming, multi-window Android app management on desktop, and instant drag-and-drop file transfers.',
    technologies: [
      'Electron',
      'Node.js',
      'ADB Protocol',
      'React',
      'WebSockets',
    ],
    githubUrl: 'https://github.com/PRN-6/phone-space66',
    accentColor: '#f97316', // Orange
    position: [0.0, 2.0, -3.2],
    size: 1.3,
    rotationSpeed: [-0.15, 0.15, 0.08],
  },
];

