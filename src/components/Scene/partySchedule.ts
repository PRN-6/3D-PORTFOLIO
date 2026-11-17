import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';

export const DAY_LENGTH = 128;
export const members = ['Frieren', 'Himmel', 'Heiter', 'Eisen'] as const;
export type Member = typeof members[number];
type Place = readonly [number, number];
type Station = { at: Place; facing: number; seatDepth?: number };
type Activity = 'Read' | 'Sword' | 'SwordForm' | 'Drink' | 'Chop' | 'Idle' | 'Watch' | 'Cast' | 'Flowers' | 'Talk' | 'Axe' | 'Lift' | 'Gather';
type Stop = { start: number; end: number; action: Activity; station: Station };
type Walk = { start: number; end: number; action: 'Walk'; curve: CatmullRomCurve3; length: number; speed: number; from: Station; to: Station };
export type Beat = Stop | Walk;
const toward = (from: Place, to: Place) => Math.atan2(to[0] - from[0], to[1] - from[1]);
function station(x: number, z: number, look: Place, seatDepth = 0): Station {
  return { at: [x, z], facing: toward([x, z], look), seatDepth };
}
const dummy: Place = [4.16, -.75];
const reader = station(2.67, 4.12, [3.10, 5.34], .35);
const priest = station(-2.70, .18, [-1.96, 1.80], .29);
const wood = station(1.81, -2.76, [1.00, -2.66]);
const swordsman = station(4.14, .34, [4.01,-.75]);
const garden = station(-1.65, 4.58, [-1.92, 4.62]);
const meadow = station(.48, 3.31, [.94, 4.35]);
const gallery = station(1.95, .05, dummy);
const conversation = station(2.19, 1.08, [2.65, .57]);
const listener = station(2.76, .64, conversation.at);
const axeman = station(3.04, -.95, dummy);
const exercise = station(2.15, -.87, [2.95, .13]);
const camp: Record<Member, Station> = {
  Frieren: station(1.52, 2.76, [2.85, 2.98], .21),
  Himmel: station(3.79, 3.12, [2.40, 3.75], .32),
  Heiter: station(2.48, 1.79, [2.32, 3.06], .20),
  Eisen: station(2.34, 4.07, [3.17, 3.04], .29),
};
export const walkingSpeed: Record<Member, number> = { Frieren: .80, Himmel: .91, Heiter: .84, Eisen: .78 };
const ramp = .32;
export function approach(s: Station): Vector3 {
  const depth = s.seatDepth ?? 0;
  return new Vector3(s.at[0] + Math.sin(s.facing) * depth, 0, s.at[1] + Math.cos(s.facing) * depth);
}

// Routes start and end at the standing side of each seat. Timed holds let the
// four independent performances meet at the yard and hearth on the same clock.
function itinerary(member: Member, home: Station) {
  const beats: Beat[] = [];
  let here = home;
  let time = 0;
  return {
    beats,
    stay(until: number, action: Activity) {
      if (until <= time) throw new Error(member + ' has insufficient time to reach ' + action);
      beats.push({ start: time, end: until, action, station: here });
      time = until;
    },
    go(to: Station, via: Place[] = []) {
      const points = [approach(here), ...via.map(([x, z]) => new Vector3(x, 0, z)), approach(to)];
      const curve = new CatmullRomCurve3(points, false, 'centripetal');
      const length = curve.getLength();
      const speed = walkingSpeed[member];
      const end = time + length / speed + ramp;
      beats.push({ start: time, end, action: 'Walk', curve, length, speed, from: here, to });
      here = to;
      time = end;
    },
  };
}
const frieren = itinerary('Frieren', reader);
frieren.stay(10, 'Read');
frieren.go(garden, [[1.86,4.51],[1.42,4.13],[.41,3.81],[-.83,4.63]]);
frieren.stay(24, 'Flowers');
frieren.go(meadow, [[-.77,4.68],[.02,4.02]]);
frieren.stay(35, 'Cast');
// Follow the west wall behind the cottage and return by the woodpile.
frieren.go(gallery, [[-.55,2.68],[-1.07,1.39],[-2.53,1.51],[-3.27,1.44],[-3.34,.63],[-3.43,-.89],[-3.44,-2.86],[-3.36,-4.20],[-3.45,-4.93],[-1.48,-4.99],[.93,-4.99],[1.88,-4.71],[1.86,-3.48],[1.83,-1.81]]);
frieren.stay(67, 'Watch');
frieren.go(camp.Frieren, [[1.38,.93],[1.31,1.98]]);
frieren.stay(109, 'Gather');
frieren.go(reader, [[1.32,3.48],[1.63,4.15],[1.88,4.52]]);
frieren.stay(DAY_LENGTH, 'Read');

const himmel = itinerary('Himmel', swordsman);
himmel.stay(14, 'Sword');
himmel.stay(16, 'Idle');
himmel.go(listener, [[3.75,.82]]);
himmel.stay(26, 'Talk');
himmel.go(station(-.16, 2.65, [-1.6,4.5]), [[2.98,1.34],[2.50,1.84],[.95,2.19]]);
himmel.stay(34, 'SwordForm');
himmel.go(swordsman, [[1.16,2.22],[2.49,1.56],[3.74,.96]]);
himmel.stay(76, 'Sword');
himmel.go(camp.Himmel, [[4.22,1.22],[3.38,1.80],[3.31,2.57]]);
himmel.stay(103, 'Gather');
himmel.go(swordsman, [[3.35,2.37],[3.96,1.67]]);
himmel.stay(DAY_LENGTH, 'Sword');

const heiter = itinerary('Heiter', priest);
heiter.stay(11, 'Drink');
heiter.go(conversation, [[-2.25,.61],[-1.82,.58],[-1.57,.96],[-1.10,1.50],[-.18,1.66],[1.10,1.48]]);
heiter.stay(29, 'Talk');
heiter.go(station(2.44,.75,dummy));
heiter.stay(68, 'Watch');
heiter.go(camp.Heiter, [[2.56,1.24],[2.53,1.56]]);
heiter.stay(110, 'Gather');
heiter.go(priest, [[1.37,1.67],[.03,1.78],[-1.10,1.42],[-1.57,.96],[-1.82,.58],[-2.25,.61]]);
heiter.stay(DAY_LENGTH, 'Drink');

const eisen = itinerary('Eisen', wood);
eisen.stay(20, 'Chop');
eisen.go(exercise, [[1.92,-1.82]]);
eisen.stay(34, 'Lift');
eisen.go(axeman);
eisen.stay(65.2, 'Axe');
eisen.go(wood, [[2.27,-1.59],[1.90,-2.05]]);
eisen.stay(69.8, 'Chop');
eisen.go(camp.Eisen, [[2.01,-1.70],[2.06,-.38],[2.69,.98],[3.21,1.79],[3.28,2.74],[3.15,3.47]]);
eisen.stay(107, 'Gather');
eisen.go(wood, [[3.17,3.48],[3.29,2.62],[3.18,1.70],[2.51,.89],[2.10,-.31],[2.04,-1.68]]);
eisen.stay(DAY_LENGTH, 'Chop');

export const schedules: Record<Member, Beat[]> = {
  Frieren: frieren.beats, Himmel: himmel.beats, Heiter: heiter.beats, Eisen: eisen.beats,
};

export function sampleWalk(beat: Walk, time: number, position: Vector3, tangent: Vector3) {
  const t = MathUtils.clamp(time - beat.start, 0, beat.end - beat.start);
  const remaining = beat.end - beat.start - t;
  // Integrate a linear speed ramp to match the planted-foot phase of the walk clip.
  const distance = t < ramp ? beat.speed * t*t/(2*ramp)
    : remaining < ramp ? beat.length - beat.speed * remaining*remaining/(2*ramp)
    : beat.speed * (t - ramp/2);
  const u = MathUtils.clamp(distance / beat.length, 0, 1);
  beat.curve.getPointAt(u, position);
  beat.curve.getTangentAt(u, tangent);
  return Math.min(1, t/ramp, remaining/ramp);
}
export function nightAmount(t: number) {
  return MathUtils.smoothstep(t, 64, 79) * (1 - MathUtils.smoothstep(t, 105, 120));
}
export function speakerAt(t: number): Member {
  const turns: Member[] = ['Heiter','Himmel','Frieren','Eisen','Frieren','Heiter'];
  return turns[Math.floor(Math.max(0,t-74)/5.4) % turns.length];
}




