import { midiToFrequency, pitchClass } from "./pitch.ts";

export interface ToneComponent {
  frequency: number;
  amplitude: number;
}

export interface ShepardToneOptions {
  /** Frequency in Hz where the loudness envelope peaks. Defaults to the middle of the voice range. */
  center?: number;
  /** Width of the loudness envelope in octaves (standard deviation). */
  spread?: number;
  minFrequency?: number;
  maxFrequency?: number;
  a4?: number;
}

/**
 * Octave-spaced components for a Shepard-style tone: one pitch class sounding in every
 * octave at once, loudest around `center` and fading out on a bell curve either side.
 * The result has a clear pitch class but no definite octave. Amplitudes sum to 1.
 */
export function shepardTone(pitch: number, options: ShepardToneOptions = {}): ToneComponent[] {
  const { center = 250, spread = 1, minFrequency = 40, maxFrequency = 4000, a4 = 440 } = options;

  const components: ToneComponent[] = [];
  // MIDI 0–11 is the lowest octave; double up from there.
  for (
    let frequency = midiToFrequency(pitchClass(pitch), a4);
    frequency <= maxFrequency;
    frequency *= 2
  ) {
    if (frequency < minFrequency) continue;
    const octavesFromCenter = Math.log2(frequency / center);
    const amplitude = Math.exp(-0.5 * (octavesFromCenter / spread) ** 2);
    if (amplitude > 0.01) components.push({ frequency, amplitude });
  }

  const total = components.reduce((sum, c) => sum + c.amplitude, 0);
  return components.map((c) => ({ ...c, amplitude: c.amplitude / total }));
}
