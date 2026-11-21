import type { AnalyzedComponent } from './ModelAnalyzer';
import type { AnimationPreset } from './AnimationPresets';

export interface ComponentTiming {
  component: AnalyzedComponent;
  start: number;
  end: number;
}

/**
 * Choreographs progressive layer arrivals.
 * Maps global animation progress P in [0, 1] into individual component local progress u in [0, 1].
 */
export class AssemblyTimeline {
  private timings: ComponentTiming[] = [];

  constructor(components: AnalyzedComponent[], preset: AnimationPreset) {
    this.rebuild(components, preset);
  }

  /**
   * Rebuilds timing windows based on component layer orders and preset stagger configuration.
   */
  public rebuild(components: AnalyzedComponent[], preset: AnimationPreset): void {
    const spread = preset.staggerSpread;
    this.timings = components.map((comp) => {
      const [rawStart, rawEnd] = comp.timingWindow;
      const duration = rawEnd - rawStart;

      // Scale timing window around layer center by spread factor
      const mid = (rawStart + rawEnd) / 2;
      const scaledDuration = duration * (0.8 + 0.4 * spread);
      const start = Math.max(0, mid - scaledDuration / 2);
      const end = Math.min(1.0, mid + scaledDuration / 2);

      return {
        component: comp,
        start,
        end: Math.max(start + 0.1, end),
      };
    });
  }

  /**
   * Evaluates the local progress u in [0, 1] for a component given global progress P in [0, 1].
   */
  public getComponentProgress(compName: string, globalProgress: number): number {
    const t = this.timings.find((item) => item.component.name === compName);
    if (!t) return globalProgress;

    if (globalProgress <= t.start) return 0.0;
    if (globalProgress >= t.end) return 1.0;

    return (globalProgress - t.start) / (t.end - t.start);
  }

  /**
   * Returns all component timings.
   */
  public getTimings(): readonly ComponentTiming[] {
    return this.timings;
  }
}

