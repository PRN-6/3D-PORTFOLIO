import { useEffect, useState } from 'react';
import { dayNightManager, type DayNightState } from '../config/dayNightState';

export function useDayNight(): DayNightState {
  const [state, setState] = useState<DayNightState>(dayNightManager.getState());

  useEffect(() => {
    return dayNightManager.subscribe(setState);
  }, []);

  return state;
}
