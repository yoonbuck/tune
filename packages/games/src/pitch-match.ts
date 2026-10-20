import { frequencyToMidi, pitchClassDifference } from "@tune/theory";

export interface PitchMatchOptions {
  /** Farthest from the target that still counts, in cents either side. */
  toleranceCents?: number;
  /** Time to fill progress when exactly on pitch; slower the further off you are. */
  fillMs?: number;
  /** Time for full progress to drain away while off pitch or silent. */
  drainMs?: number;
}

export interface PitchMatchState {
  /** Accumulated progress toward a match, 0–1. */
  progress: number;
  /** How close the current pitch is, 0 (outside tolerance or silent) to 1 (exactly on). */
  closeness: number;
  matched: boolean;
}

/** Longest step applied in one update, so gaps (e.g. a backgrounded tab) don't jump progress. */
const MAX_STEP_MS = 100;

/** One round of "hear a pitch class, then hum it back in any octave". */
export class PitchMatch {
  readonly target: number;
  readonly #toleranceCents: number;
  readonly #fillMs: number;
  readonly #drainMs: number;

  /** Progress in ms of perfect-pitch holding, so exact holds add up without float drift. */
  #heldMs = 0;
  #lastUpdateAt: number | null = null;

  constructor(target: number, options: PitchMatchOptions = {}) {
    this.target = target;
    this.#toleranceCents = options.toleranceCents ?? 40;
    this.#fillMs = options.fillMs ?? 800;
    this.#drainMs = options.drainMs ?? 1500;
  }

  /** Feed one frame's detected frequency (null for none). Once matched, stays matched. */
  update(frequency: number | null, timeMs: number): PitchMatchState {
    const elapsed =
      this.#lastUpdateAt === null ? 0 : Math.min(MAX_STEP_MS, timeMs - this.#lastUpdateAt);
    this.#lastUpdateAt = timeMs;
    const closeness = this.#closeness(frequency);

    if (this.#heldMs < this.#fillMs) {
      const change =
        closeness > 0 ? closeness * elapsed : (-elapsed * this.#fillMs) / this.#drainMs;
      this.#heldMs = Math.min(this.#fillMs, Math.max(0, this.#heldMs + change));
    }
    const progress = this.#heldMs / this.#fillMs;
    return { progress, closeness, matched: progress === 1 };
  }

  /** 1 on target, falling off quadratically to 0 at the tolerance, so near misses still count well. */
  #closeness(frequency: number | null): number {
    if (frequency === null) return 0;
    const offsetCents = Math.abs(
      pitchClassDifference(frequencyToMidi(frequency), this.target) * 100,
    );
    return Math.max(0, 1 - (offsetCents / this.#toleranceCents) ** 2);
  }
}

/** A random pitch class 0–11, never the same as `previous`. */
export function randomPitchClass(previous?: number, random: () => number = Math.random): number {
  if (previous === undefined) return Math.floor(random() * 12);
  const pick = Math.floor(random() * 11);
  return pick >= previous ? pick + 1 : pick;
}
