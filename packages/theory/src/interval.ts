import type { Midi } from "./pitch.ts";

export interface Interval {
  semitones: number;
  /** Short quality/number label, e.g. "m3". */
  short: string;
  name: string;
}

/** Simple intervals from unison to octave. */
export const INTERVALS: readonly Interval[] = [
  { semitones: 0, short: "P1", name: "Perfect unison" },
  { semitones: 1, short: "m2", name: "Minor second" },
  { semitones: 2, short: "M2", name: "Major second" },
  { semitones: 3, short: "m3", name: "Minor third" },
  { semitones: 4, short: "M3", name: "Major third" },
  { semitones: 5, short: "P4", name: "Perfect fourth" },
  { semitones: 6, short: "TT", name: "Tritone" },
  { semitones: 7, short: "P5", name: "Perfect fifth" },
  { semitones: 8, short: "m6", name: "Minor sixth" },
  { semitones: 9, short: "M6", name: "Major sixth" },
  { semitones: 10, short: "m7", name: "Minor seventh" },
  { semitones: 11, short: "M7", name: "Major seventh" },
  { semitones: 12, short: "P8", name: "Perfect octave" },
];

export function transpose(midi: Midi, interval: Interval): Midi {
  return midi + interval.semitones;
}
