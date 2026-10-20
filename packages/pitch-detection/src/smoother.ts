export interface PitchSmootherOptions {
  /** Number of recent estimates to take the median of, to reject one-off glitches. */
  windowSize?: number;
  /** Time constant in ms for easing toward the median. Higher is steadier but slower. */
  smoothingMs?: number;
  /** Jumps larger than this many cents skip easing, so note changes feel immediate. */
  snapCents?: number;
  /** How long to keep reporting the last pitch after estimates stop arriving. */
  holdMs?: number;
}

/**
 * Turns a noisy per-frame stream of pitch estimates into a steady one suitable for display.
 * Works in cents internally so smoothing behaves the same in every register.
 */
export class PitchSmoother {
  readonly #windowSize: number;
  readonly #smoothingMs: number;
  readonly #snapCents: number;
  readonly #holdMs: number;

  #window: number[] = [];
  #cents: number | null = null;
  #lastPitchAt = 0;

  constructor(options: PitchSmootherOptions = {}) {
    this.#windowSize = options.windowSize ?? 5;
    this.#smoothingMs = options.smoothingMs ?? 120;
    this.#snapCents = options.snapCents ?? 100;
    this.#holdMs = options.holdMs ?? 250;
  }

  /**
   * Feed one frame's estimate (null when no pitch was detected) and get the smoothed
   * frequency in Hz, or null once the input has been silent for longer than `holdMs`.
   */
  push(frequency: number | null, timeMs: number): number | null {
    if (frequency === null) {
      if (timeMs - this.#lastPitchAt > this.#holdMs) this.reset();
      return this.#frequency();
    }

    this.#window.push(1200 * Math.log2(frequency));
    if (this.#window.length > this.#windowSize) this.#window.shift();
    const target = median(this.#window);

    if (this.#cents === null || Math.abs(target - this.#cents) > this.#snapCents) {
      this.#cents = target;
    } else {
      const alpha = 1 - Math.exp(-(timeMs - this.#lastPitchAt) / this.#smoothingMs);
      this.#cents += alpha * (target - this.#cents);
    }
    this.#lastPitchAt = timeMs;
    return this.#frequency();
  }

  reset(): void {
    this.#window = [];
    this.#cents = null;
  }

  #frequency(): number | null {
    return this.#cents === null ? null : 2 ** (this.#cents / 1200);
  }
}

function median(values: number[]): number {
  const sorted = values.toSorted((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}
