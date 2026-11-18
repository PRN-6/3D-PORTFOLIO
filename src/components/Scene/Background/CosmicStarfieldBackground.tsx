import React, { useMemo } from 'react';

/**
 * CosmicStarfieldBackground
 *
 * Provides a rich, immersive deep-space fantasy background behind the
 * fixed cinematic typography and the 3D WebGL floating island.
 *
 * Layer 1 in visual hierarchy:
 * 1. Deep space starry background (this component)
 * 2. Fixed cinematic PRINSON typography
 * 3. Transparent 3D Canvas with floating island & characters
 * 4. UI controls & navigation
 */
export const CosmicStarfieldBackground: React.FC = () => {
  // Deterministic star field generation to prevent layout shifts or re-render churn
  const stars = useMemo(() => {
    const list = [];
    // Seeded pseudo-random generator
    let seed = 42;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 110; i++) {
      const x = random() * 100;
      const y = random() * 100;
      const size = random() < 0.8 ? random() * 1.5 + 0.8 : random() * 2.5 + 1.8;
      const opacity = random() * 0.55 + 0.25;
      const pulseDelay = random() * 6;
      const pulseDuration = random() * 4 + 3;

      list.push({
        id: i,
        x,
        y,
        size,
        opacity,
        pulseDelay,
        pulseDuration,
      });
    }
    return list;
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 bg-[#000000]"
    >
      {/* Crisp minimal starlight points against pure black */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {stars.map((star) => (
          <circle
            key={star.id}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="#ffffff"
            opacity={star.opacity * 0.75}
          />
        ))}
      </svg>
    </div>
  );
};

