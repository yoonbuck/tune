export interface PitchDetectionOptions {
  /** Lowest detectable frequency in Hz. Also bounds how many samples are needed. */
  minFrequency?: number;
  /** Highest detectable frequency in Hz. */
  maxFrequency?: number;
  /** YIN aperiodicity threshold (0–1). Lower is stricter about what counts as pitched. */
  threshold?: number;
  /** RMS level below which the input is treated as silence. */
  silenceRms?: number;
}

export interface PitchEstimate {
  frequency: number;
  /** How periodic the signal is, 0–1. */
  clarity: number;
}

/**
 * Estimate the fundamental frequency of a mono buffer using YIN
 * (de Cheveigné & Kawahara, 2002). Returns null for silence or unpitched input.
 *
 * The buffer must be at least twice the period of `minFrequency`.
 */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  options: PitchDetectionOptions = {},
): PitchEstimate | null {
  const { minFrequency = 60, maxFrequency = 1500, threshold = 0.15, silenceRms = 0.01 } = options;

  if (rms(samples) < silenceRms) return null;

  const tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const tauMax = Math.min(Math.ceil(sampleRate / minFrequency), Math.floor(samples.length / 2));
  if (tauMax <= tauMin) return null;

  const cmnd = cumulativeMeanNormalizedDifference(samples, tauMax);

  // Take the first dip below the threshold rather than the global minimum;
  // later dips are at multiples of the period and would give octave errors.
  let tau = tauMin;
  while (tau <= tauMax && cmnd[tau]! >= threshold) tau++;
  if (tau > tauMax) return null;
  while (tau < tauMax && cmnd[tau + 1]! < cmnd[tau]!) tau++;

  return {
    frequency: sampleRate / refineMinimum(cmnd, tau),
    clarity: Math.max(0, 1 - cmnd[tau]!),
  };
}

function rms(samples: Float32Array): number {
  let sum = 0;
  for (const s of samples) sum += s * s;
  return Math.sqrt(sum / samples.length);
}

/** YIN steps 2–3: squared difference at each lag, normalized by its running mean. */
function cumulativeMeanNormalizedDifference(samples: Float32Array, tauMax: number): Float32Array {
  const window = samples.length - tauMax;
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;

  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const delta = samples[i]! - samples[i + tau]!;
      sum += delta * delta;
    }
    runningSum += sum;
    cmnd[tau] = runningSum === 0 ? 1 : (sum * tau) / runningSum;
  }
  return cmnd;
}

/** Parabolic interpolation around an integer minimum for sub-sample accuracy. */
function refineMinimum(values: Float32Array, index: number): number {
  if (index <= 0 || index >= values.length - 1) return index;
  const a = values[index - 1]!;
  const b = values[index]!;
  const c = values[index + 1]!;
  const denominator = a - 2 * b + c;
  return denominator === 0 ? index : index + (a - c) / (2 * denominator);
}
