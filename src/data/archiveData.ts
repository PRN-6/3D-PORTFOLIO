/**
 * archiveData.ts
 * Data definitions and editable content for Island 02 — Grand Mage's Archive.
 * 
 * NOTE: All skill descriptions, experience timelines, and profile data below are
 * clearly labeled editable sample content ready to be tailored with your exact details.
 */

export interface SpellItem {
  id: string;
  name: string;
  tier: 'Grandmaster Spell' | 'Mastery Incantation' | 'Adept Evocation' | 'Foundational Cantrip';
  description: string;
  tags: string[];
}

export interface GrimoireItem {
  id: string;
  nodeName: string;
  modelFile: string;
  title: string;
  category: string;
  tagline: string;
  accentColor: string;
  glowColor: string;
  runeSymbol: string;
  position: [number, number, number];
  rotation: [number, number, number];
  lore: string;
  spells: SpellItem[];
}

export interface ExperienceEntry {
  period: string;
  role: string;
  organization: string;
  realm: string; // e.g. "Remote / Frontier"
  summary: string;
  feats: string[];
}

export interface EducationEntry {
  period: string;
  degree: string;
  institution: string;
  details: string;
}

export interface AccoladeEntry {
  name: string;
  date: string;
  issuer: string;
  description: string;
}

export interface MageProfile {
  name: string;
  title: string;
  epithet: string;
  quote: string;
  biography: string[];
  attributes: { label: string; value: string; hint?: string }[];
  chronicle: ExperienceEntry[];
  academies: EducationEntry[];
  accolades: AccoladeEntry[];
}

// ---------------------------------------------------------------------------
// 6 Interactive Skill Grimoires (Coordinates matched to archive-grimoires arc)
// ---------------------------------------------------------------------------
export const GRIMOIRES_DATA: GrimoireItem[] = [
  {
    id: 'frontend',
    nodeName: 'Grimoire_1',
    modelFile: '/models/archive/grimoire-frontend.glb',
    title: 'Grimoire of Radiant Interfaces',
    category: 'Frontend Magic',
    tagline: 'Weaving reactive user experiences, performant DOM hierarchies, and tactile micro-interactions.',
    accentColor: '#38bdf8', // Cyan / Electric Sky
    glowColor: 'rgba(56, 189, 248, 0.45)',
    runeSymbol: '✦',
    position: [-6.08676, 1.3, 3.25],
    rotation: [0, 0.48, 0],
    lore: 'Ancient scrolls describing the manipulation of light and responsive glass, rendering intricate user conduits across digital realms.',
    spells: [
      {
        id: 'fe-1',
        name: 'React 19 & Component Architecture',
        tier: 'Grandmaster Spell',
        description: '[Sample Content] Deep mastery of concurrent rendering, React Server Components, custom hooks, and deterministic unidirectional state flow.',
        tags: ['React', 'TypeScript', 'State Machines', 'Hooks'],
      },
      {
        id: 'fe-2',
        name: 'TypeScript & Type Alchemy',
        tier: 'Grandmaster Spell',
        description: '[Sample Content] Strict compiler configurations, complex generics, conditional mapped types, and bulletproof runtime boundary assertions.',
        tags: ['TypeScript', 'Generics', 'AST', 'Zod'],
      },
      {
        id: 'fe-3',
        name: 'Tailwind CSS & Design Tokens',
        tier: 'Mastery Incantation',
        description: '[Sample Content] High-velocity styling architecture, fluid responsive typography, glassmorphism aesthetics, and accessibility-first design systems.',
        tags: ['TailwindCSS', 'CSS3', 'Framer Motion', 'Radix UI'],
      },
      {
        id: 'fe-4',
        name: 'Next.js & Vite Ecosystems',
        tier: 'Mastery Incantation',
        description: '[Sample Content] Sub-second HMR bundlers, code-splitting, tree-shaking, static generation, and edge caching pipelines.',
        tags: ['Next.js', 'Vite', 'Turbopack', 'ESBuild'],
      },
    ],
  },
  {
    id: 'backend',
    nodeName: 'Grimoire_2',
    modelFile: '/models/archive/grimoire-backend.glb',
    title: 'Grimoire of Alchemy & Distributed Cores',
    category: 'Backend Alchemy',
    tagline: 'Constructing resilient high-throughput APIs, fault-tolerant persistence layers, and real-time streams.',
    accentColor: '#10b981', // Emerald Green
    glowColor: 'rgba(16, 185, 129, 0.45)',
    runeSymbol: '☿',
    position: [-4.3811, 1.3, 4.04351],
    rotation: [0, 0.28, 0],
    lore: 'Heavy leather-bound tome detailing transmutation of raw packet streams into structured truth, surviving concurrent database storms.',
    spells: [
      {
        id: 'be-1',
        name: 'Node.js & Python Microservices',
        tier: 'Grandmaster Spell',
        description: '[Sample Content] Asynchronous event-loop optimization, FastAPI/Express architectures, process clustering, and non-blocking I/O orchestration.',
        tags: ['Node.js', 'Python', 'FastAPI', 'Express', 'AsyncIO'],
      },
      {
        id: 'be-2',
        name: 'PostgreSQL & Relational Calculus',
        tier: 'Mastery Incantation',
        description: '[Sample Content] Query planning & index tuning, ACID guarantees, migrations, Prisma ORM, and resilient connection pooling.',
        tags: ['PostgreSQL', 'Prisma', 'SQL', 'Connection Pooling'],
      },
      {
        id: 'be-3',
        name: 'Redis In-Memory Fabric & Queues',
        tier: 'Mastery Incantation',
        description: '[Sample Content] Sub-millisecond distributed caching, Pub/Sub channels, rate limiting, and reliable message queuing.',
        tags: ['Redis', 'Pub/Sub', 'BullMQ', 'Rate Limiting'],
      },
      {
        id: 'be-4',
        name: 'RESTful & GraphQL Protocols',
        tier: 'Adept Evocation',
        description: '[Sample Content] Clean API contract design, strict OpenAPI specifications, Apollo GraphQL schemas, and WebSockets.',
        tags: ['REST', 'GraphQL', 'WebSockets', 'OpenAPI'],
      },
    ],
  },
  {
    id: 'ai-agents',
    nodeName: 'Grimoire_3',
    modelFile: '/models/archive/grimoire-ai-agents.glb',
    title: 'Grimoire of Autonomous Familiars',
    category: 'AI and Autonomous Agents',
    tagline: 'Breathing agency into language models, multi-agent swarms, local audio biometrics, and neural vision.',
    accentColor: '#818cf8', // Indigo / Celestial Violet
    glowColor: 'rgba(129, 140, 248, 0.45)',
    runeSymbol: '◈',
    position: [-1.59162, 1.3, 4.53393],
    rotation: [0, 0.10, 0],
    lore: 'Glowing grimoire inscribed with living runes that think, perceive voice waves, identify voices through biometric resonance, and act autonomously.',
    spells: [
      {
        id: 'ai-1',
        name: 'Autonomous Agentic Swarms & Tool Use',
        tier: 'Grandmaster Spell',
        description: '[Sample Content] Multi-agent orchestration, dynamic tool-calling, self-correction loops, ReAct patterns, and persistent memory.',
        tags: ['LangChain', 'LlamaIndex', 'MCP', 'Tool Calling', 'CrewAI'],
      },
      {
        id: 'ai-2',
        name: '100% Local Inference & Model Quantization',
        tier: 'Grandmaster Spell',
        description: '[Sample Content] Offline neural inference via Ollama, llama.cpp, faster-whisper, Silero VAD, and GGUF quantized models with strict privacy.',
        tags: ['Ollama', 'llama.cpp', 'faster-whisper', 'Silero VAD', 'PyTorch'],
      },
      {
        id: 'ai-3',
        name: 'Voice Biometrics & Neural Vision',
        tier: 'Mastery Incantation',
        description: '[Sample Content] CAM++ speaker voiceprint verification, real-time hand landmark tracking with MediaPipe, and multimodal embeddings.',
        tags: ['CAM++', 'MediaPipe', 'OpenCV', 'Embeddings', 'Vector Search'],
      },
      {
        id: 'ai-4',
        name: 'RAG & Vector Retrieval Magic',
        tier: 'Mastery Incantation',
        description: '[Sample Content] Chunking strategies, hybrid BM25 + dense vector search, rerankers, and contextual hallucination prevention.',
        tags: ['ChromaDB', 'FAISS', 'Qdrant', 'RAG'],
      },
    ],
  },
  {
    id: 'systems',
    nodeName: 'Grimoire_4',
    modelFile: '/models/archive/grimoire-systems.glb',
    title: 'Grimoire of Iron & Fundamental Runes',
    category: 'Systems and Programming',
    tagline: 'Manipulating low-level system kernels, OS automation, memory safety, and native hardware interfaces.',
    accentColor: '#3b82f6', // Sapphire Blue
    glowColor: 'rgba(59, 130, 246, 0.45)',
    runeSymbol: '⚙',
    position: [1.59162, 1.3, 4.53393],
    rotation: [0, -0.10, 0],
    lore: 'A codex bound with cold iron plates, containing formulas for direct OS socket control, low-level process injection, and memory layouts.',
    spells: [
      {
        id: 'sys-1',
        name: 'Windows API & Desktop Automation',
        tier: 'Grandmaster Spell',
        description: '[Sample Content] Low-level Win32 API hooks, synthetic input dispatch, window handle management, and background daemon lifecycles.',
        tags: ['Win32 API', 'ctypes', 'Process Automation', 'PyWin32'],
      },
      {
        id: 'sys-2',
        name: 'Memory Management & Algorithmic Parity',
        tier: 'Mastery Incantation',
        description: '[Sample Content] State space search (IDA* God’s Algorithm, Kociemba Two-Phase), permutation parity calculation, and bitwise flags.',
        tags: ['Algorithms', 'State Space Search', 'CFOP', 'Data Structures'],
      },
      {
        id: 'sys-3',
        name: 'Rust & Systems Programming Foundations',
        tier: 'Adept Evocation',
        description: '[Sample Content] Borrow checker semantics, zero-cost abstractions, safe concurrency, and native C-FFI bindings.',
        tags: ['Rust', 'C/C++', 'Concurrency', 'FFI'],
      },
      {
        id: 'sys-4',
        name: 'Bash & PowerShell Infrastructure Scripting',
        tier: 'Foundational Cantrip',
        description: '[Sample Content] Cross-platform shell automation, background task workers, automated build pipelines, and CLI tooling.',
        tags: ['PowerShell', 'Bash', 'CLI Tooling', 'Pipelines'],
      },
    ],
  },
  {
    id: 'creative-3d',
    nodeName: 'Grimoire_5',
    modelFile: '/models/archive/grimoire-creative-3d.glb',
    title: 'Grimoire of Phantasms & Dimensions',
    category: '3D and Creative Technology',
    tagline: 'Summoning real-time 3D realms, custom GLSL shaders, cel-shading pipelines, and interactive spatial artifacts.',
    accentColor: '#f43f5e', // Crimson / Arcane Rose
    glowColor: 'rgba(244, 63, 94, 0.45)',
    runeSymbol: '◇',
    position: [4.3811, 1.3, 4.04351],
    rotation: [0, -0.28, 0],
    lore: 'Illuminated manuscript pulsing with holographic geometry, containing secret knowledge of matrix transforms and light bounce shaders.',
    spells: [
      {
        id: 'c3d-1',
        name: 'Three.js & React Three Fiber',
        tier: 'Grandmaster Spell',
        description: '[Sample Content] Scene graph management, custom skinned mesh rigging, procedural geometry, raycasting picking, and frame-rate budgeting.',
        tags: ['Three.js', 'R3F', '@react-three/drei', 'WebGL'],
      },
      {
        id: 'c3d-2',
        name: 'Custom GLSL Shaders & Cel Shading',
        tier: 'Mastery Incantation',
        description: '[Sample Content] Vertex extrusion ink outlines, quantized ramp cel shading, iridescent Fresnel glows, and screen-space post-processing.',
        tags: ['GLSL', 'Shaders', 'Cel Shading', 'PostProcessing'],
      },
      {
        id: 'c3d-3',
        name: '3D Asset Optimization & SkeletonUtils',
        tier: 'Mastery Incantation',
        description: '[Sample Content] Draco/KTX2 compression, LOD management, SkeletonUtils cloning for skinned animators, and GPU draw call batching.',
        tags: ['GLTF/GLB', 'Draco', 'SkeletonUtils', 'Performance'],
      },
      {
        id: 'c3d-4',
        name: 'Blender & Procedural Modeling',
        tier: 'Adept Evocation',
        description: '[Sample Content] Low-poly asset creation, UV unwrapping, armature weight painting, and action clip animation exports.',
        tags: ['Blender', 'UV Mapping', 'Rigging', 'Animation Clips'],
      },
    ],
  },
  {
    id: 'tools',
    nodeName: 'Grimoire_6',
    modelFile: '/models/archive/grimoire-tools.glb',
    title: 'Grimoire of the Grand Forge',
    category: 'Tools and Technologies',
    tagline: 'Harnessing the anvils of modern software engineering: version control, containerization, and continuous delivery.',
    accentColor: '#f59e0b', // Amber Gold
    glowColor: 'rgba(245, 158, 11, 0.45)',
    runeSymbol: '⚡',
    position: [6.08676, 1.3, 3.25],
    rotation: [0, -0.48, 0],
    lore: 'Sturdy brass-hinged field book inscribed with recipes for container alchemy, cloud orchestration, and automated artifact synthesis.',
    spells: [
      {
        id: 'tool-1',
        name: 'Git Version Control & Branch Architectures',
        tier: 'Grandmaster Spell',
        description: '[Sample Content] Rebase strategies, interactive squashing, bisect debugging, submodules, and clean trunk-based development.',
        tags: ['Git', 'GitHub Actions', 'CI/CD', 'SemVer'],
      },
      {
        id: 'tool-2',
        name: 'Docker & Containerization Alchemy',
        tier: 'Mastery Incantation',
        description: '[Sample Content] Multi-stage slim Dockerfiles, volume mount caching, docker-compose orchestration, and isolated reproducible environments.',
        tags: ['Docker', 'Containers', 'Compose', 'Linux'],
      },
      {
        id: 'tool-3',
        name: 'Testing & Verification Frameworks',
        tier: 'Mastery Incantation',
        description: '[Sample Content] Unit testing with Vitest/Jest, E2E browser automation with Playwright, and mathematical invariant fuzzing.',
        tags: ['Vitest', 'Playwright', 'Jest', 'TDD'],
      },
      {
        id: 'tool-4',
        name: 'Cloud Deployment & CDN Edge',
        tier: 'Adept Evocation',
        description: '[Sample Content] Vercel, Netlify, Railway container deployments, Cloudflare DNS, and edge worker functions.',
        tags: ['Vercel', 'Netlify', 'Railway', 'Cloudflare'],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Developer Profile & Chronicle (Editable Sample Content)
// ---------------------------------------------------------------------------
export const MAGE_PROFILE_DATA: MageProfile = {
  name: 'PRN-6 / Prins',
  title: 'Full-Stack Software Engineer & 3D Interactive Specialist',
  epithet: 'The Archmage of Interactive Realities',
  quote: '"Like spells passed down through centuries, good code endures when crafted with elegance, precision, and purpose."',
  biography: [
    '[Editable Sample Bio] A passionate software craftsman and creative technologist specializing in the intersection of real-time 3D graphics, autonomous AI systems, and robust full-stack web applications.',
    '[Editable Sample Bio] Dedicated to building seamless user interfaces that feel tactile and magical, powered by deterministic distributed backends and privacy-first local machine learning models.',
    '[Editable Sample Bio] Drawing inspiration from timeless fantasy epics like Frieren: Beyond Journey\'s End, approaching software engineering as an enduring craft where every component, shader, and database query is refined with lifelong curiosity.',
  ],
  attributes: [
    { label: 'Primary Class', value: 'Full-Stack Engineer', hint: 'React, Node, Python, 3D Web' },
    { label: 'Secondary Class', value: 'Autonomous Systems Artisan', hint: 'Local LLMs, Voice biometrics, Agents' },
    { label: 'Mana Affinity', value: 'Three.js & TypeScript', hint: 'Real-time 3D spatial computing' },
    { label: 'Base of Operations', value: 'Earth / Remote', hint: 'Available for high-impact quests' },
  ],
  chronicle: [
    {
      period: '2024 — Present',
      role: 'Lead Full-Stack & 3D Architect',
      organization: 'Independent Creative Engineering Studio',
      realm: 'Global Remote',
      summary: '[Editable Sample Experience] Spearheaded development of immersive 3D interactive web experiences, autonomous voice-controlled OS software, and high-performance puzzle solvers.',
      feats: [
        'Architected PRIVACY68: 100% offline local voice assistant with biometric speaker verification and zero cloud dependencies.',
        'Engineered CUBIX68: Interactive 3D twisty puzzle scanner & solver running real-time computer vision in <5ms.',
        'Designed connected multi-island 3D portfolio with custom toon cel shading, dynamic camera transitions, and Chibi party members.',
      ],
    },
    {
      period: '2022 — 2024',
      role: 'Full-Stack Software Engineer',
      organization: 'Technology Solutions & Systems Guild',
      realm: 'Distributed',
      summary: '[Editable Sample Experience] Built and maintained scalable web applications, REST APIs, and responsive frontend systems used by thousands of active users.',
      feats: [
        'Reduced frontend bundle sizes by 42% through aggressive tree-shaking, dynamic imports, and modern bundler optimization.',
        'Implemented resilient microservices handling high-throughput event streams with Redis and PostgreSQL.',
        'Collaborated across cross-functional teams to deliver accessible, WCAG-compliant design systems.',
      ],
    },
    {
      period: '2020 — 2022',
      role: 'Frontend & Creative Technologist Apprentice',
      organization: 'Digital Innovation Labs',
      realm: 'Academic & Studio',
      summary: '[Editable Sample Experience] Focused on UI engineering, JavaScript/TypeScript mastery, WebGL graphics, and algorithmic problem solving.',
      feats: [
        'Developed interactive browser simulations and data visualizations using Canvas2D and Three.js.',
        'Contributed to open-source developer tooling and algorithmic visualization libraries.',
      ],
    },
  ],
  academies: [
    {
      period: '2019 — 2023',
      degree: 'Bachelor of Technology in Computer Science & Engineering',
      institution: 'Grand University Academy of Technology',
      details: '[Editable Sample Education] Focused on Data Structures, Algorithms, Computer Graphics, Distributed Systems, and Database Management.',
    },
  ],
  accolades: [
    {
      name: 'Master of Autonomous Systems',
      date: '2024',
      issuer: 'AI Engineering Fellowship',
      description: '[Editable Sample Feat] Recognized for building privacy-preserving local AI applications with biometric voice security.',
    },
    {
      name: 'Algorithm Optimization Distinction',
      date: '2023',
      issuer: 'Competitive Programming League',
      description: '[Editable Sample Feat] Top percentile ranking in state-space combinatorial search and graph traversal algorithms.',
    },
    {
      name: 'Creative WebGL Excellence Seal',
      date: '2023',
      issuer: '3D Web Designers Community',
      description: '[Editable Sample Feat] Commended for innovative use of cel shading and real-time interactive physics in browser-based 3D.',
    },
  ],
};

