import { nightAmount } from '../components/Scene/partySchedule';

export interface DayNightState {
  time: number;
  nightProgress: number; // 0.0 (full day) to 1.0 (full night)
  isNight: boolean;      // true if nightProgress > 0.5
}

type Listener = (state: DayNightState) => void;

class DayNightManager {
  private currentState: DayNightState = {
    time: 0,
    nightProgress: 0,
    isNight: false,
  };
  private listeners = new Set<Listener>();
  private lastBroadcast = 0;

  public getState(): DayNightState {
    return this.currentState;
  }

  public updateTime(t: number) {
    const amount = nightAmount(t);
    const isNight = amount > 0.5;

    this.currentState = {
      time: t,
      nightProgress: amount,
      isNight,
    };

    // Throttle React broadcasts to ~10Hz (every 100ms) to ensure smooth 60fps canvas performance
    const now = performance.now();
    if (now - this.lastBroadcast > 100) {
      this.lastBroadcast = now;
      for (const listener of this.listeners) {
        listener(this.currentState);
      }
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }
}

export const dayNightManager = new DayNightManager();
