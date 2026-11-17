export interface DayNightState {
  time: number;
  nightProgress: number; // 1.0 (always night)
  isNight: boolean;      // true (always night)
}

type Listener = (state: DayNightState) => void;

class DayNightManager {
  private currentState: DayNightState = {
    time: 80,
    nightProgress: 1.0,
    isNight: true,
  };
  private listeners = new Set<Listener>();

  public getState(): DayNightState {
    return this.currentState;
  }

  public updateTime(t: number) {
    this.currentState = {
      time: t,
      nightProgress: 1.0,
      isNight: true,
    };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }
}

export const dayNightManager = new DayNightManager();
