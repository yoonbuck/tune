/** A pitch as a MIDI note number (60 = middle C, 69 = A4). */
export type Midi = number;

/** Names of the 12 pitch classes, indexed from C = 0. */
export const PITCH_CLASS_NAMES: readonly string[] = [
  "C",
  "C♯",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
];

/**
 * Position within the octave, in [0, 12), ignoring which octave. Fractional MIDI
 * values give fractional results, e.g. 61.3 (C♯4 + 30¢) → 1.3.
 */
export function pitchClass(midi: Midi): number {
  return ((midi % 12) + 12) % 12;
}

/** Equal-tempered frequency in Hz for a MIDI note. */
export function midiToFrequency(midi: Midi, a4 = 440): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

/** Scientific pitch name, e.g. 60 → "C4". */
export function midiToName(midi: Midi): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${PITCH_CLASS_NAMES[pitchClass(midi)]}${octave}`;
}

/** Fractional MIDI number for a frequency, e.g. 440 Hz → 69, 452 Hz → ~69.47. */
export function frequencyToMidi(frequency: number, a4 = 440): number {
  return 69 + 12 * Math.log2(frequency / a4);
}

/** The nearest equal-tempered note to a frequency, and how far off it is in cents (−50 to +50). */
export function nearestNote(frequency: number, a4 = 440): { midi: Midi; cents: number } {
  const exact = frequencyToMidi(frequency, a4);
  const midi = Math.round(exact);
  return { midi, cents: (exact - midi) * 100 };
}

/**
 * Signed distance from `b` to `a` in semitones ignoring octave, in [−6, 6).
 * E.g. B3 vs C: −1, D5 vs C: +2.
 */
export function pitchClassDifference(a: Midi, b: Midi): number {
  const difference = pitchClass(a - b);
  return difference >= 6 ? difference - 12 : difference;
}
