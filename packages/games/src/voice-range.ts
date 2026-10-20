export interface VoiceRangeOptions {
  /** Estimate in Hz before any humming has been heard. */
  initialCenter?: number;
  /** Humming time for the estimate to move ~63% of the way to a new register. */
  adaptMs?: number;
  /** Frequencies outside this range are ignored as unlikely to be the user's voice. */
  minFrequency?: number;
  maxFrequency?: number;
}

/** Longest step applied in one update, so gaps between frames don't count as humming. */
const MAX_STEP_MS = 100;

/**
 * Tracks the general region a user hums in, as a slow moving average on a log scale.
 * Humming across different octaves settles between them rather than on any one.
 */
export class VoiceRange {
  readonly #adaptMs: number;
  readonly #minFrequency: number;
  readonly #maxFrequency: number;

  #centerCents: number;
  #lastObservedAt: number | null = null;

  constructor(options: VoiceRangeOptions = {}) {
    this.#adaptMs = options.adaptMs ?? 15_000;
    this.#minFrequency = options.minFrequency ?? 70;
    this.#maxFrequency = options.maxFrequency ?? 1000;
    this.#centerCents = toCents(options.initialCenter ?? 250);
  }

  /** Center of the user's humming region in Hz. */
  get center(): number {
    return 2 ** (this.#centerCents / 1200);
  }

  /** Feed one frame's detected frequency (null for none) while the user is humming. */
  observe(frequency: number | null, timeMs: number): void {
    const elapsed =
      this.#lastObservedAt === null ? 0 : Math.min(MAX_STEP_MS, timeMs - this.#lastObservedAt);
    this.#lastObservedAt = timeMs;
    if (frequency === null || frequency < this.#minFrequency || frequency > this.#maxFrequency)
      return;

    const alpha = 1 - Math.exp(-elapsed / this.#adaptMs);
    this.#centerCents += alpha * (toCents(frequency) - this.#centerCents);
  }
}

function toCents(frequency: number): number {
  return 1200 * Math.log2(frequency);
}
