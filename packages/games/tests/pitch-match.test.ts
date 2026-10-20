import { midiToFrequency } from "@tune/theory";
import { describe, expect, test } from "vite-plus/test";
import { PitchMatch, randomPitchClass } from "../src/index.ts";

const E = 4;
const E3 = midiToFrequency(52);
const E5 = midiToFrequency(76);

const FRAME_MS = 10;

/** Feed `frequency` every frame from `fromMs` up to and including `toMs`; returns the last state. */
function hold(round: PitchMatch, frequency: number | null, fromMs: number, toMs: number) {
  let state = round.update(frequency, fromMs);
  for (let t = fromMs + FRAME_MS; t <= toMs; t += FRAME_MS) state = round.update(frequency, t);
  return state;
}

describe("PitchMatch", () => {
  test("fills in fillMs when exactly on pitch", () => {
    const round = new PitchMatch(E, { fillMs: 1000 });
    expect(hold(round, E3, 0, 500).progress).toBeCloseTo(0.5, 6);
    expect(hold(round, E3, 510, 1000)).toEqual({ progress: 1, closeness: 1, matched: true });
  });

  test("accepts any octave", () => {
    const round = new PitchMatch(E, { fillMs: 100 });
    hold(round, E5, 0, 50);
    expect(hold(round, E5 * 4, 60, 100).matched).toBe(true);
  });

  test("fills more slowly the further off pitch", () => {
    const round = new PitchMatch(E, { toleranceCents: 40, fillMs: 1000 });
    const state = hold(round, midiToFrequency(52.2), 0, 1000);
    expect(state.closeness).toBeCloseTo(0.75, 6);
    expect(state.progress).toBeCloseTo(0.75, 6);
  });

  test("does not fill beyond the tolerance", () => {
    const round = new PitchMatch(E, { toleranceCents: 40 });
    expect(hold(round, midiToFrequency(51.5), 0, 1000)).toEqual({
      progress: 0,
      closeness: 0,
      matched: false,
    });
  });

  test("drains gradually when off pitch or silent, instead of resetting", () => {
    const round = new PitchMatch(E, { fillMs: 1000, drainMs: 1000 });
    hold(round, E3, 0, 800);
    expect(hold(round, midiToFrequency(55), 810, 1000).progress).toBeCloseTo(0.6, 6);
    expect(hold(round, null, 1010, 1200).progress).toBeCloseTo(0.4, 6);
    expect(hold(round, null, 1210, 2000).progress).toBe(0);
  });

  test("caps how much a long gap between updates can change progress", () => {
    const round = new PitchMatch(E, { fillMs: 1000, drainMs: 1000 });
    hold(round, E3, 0, 500);
    expect(round.update(null, 5000).progress).toBeCloseTo(0.4, 6);
  });

  test("stays matched once matched", () => {
    const round = new PitchMatch(E, { fillMs: 100 });
    hold(round, E3, 0, 100);
    expect(round.update(null, 110)).toEqual({ progress: 1, closeness: 0, matched: true });
  });
});

describe("randomPitchClass", () => {
  test("covers all 12 pitch classes", () => {
    expect(randomPitchClass(undefined, () => 0)).toBe(0);
    expect(randomPitchClass(undefined, () => 0.999)).toBe(11);
  });

  test("never repeats the previous pitch class", () => {
    for (let previous = 0; previous < 12; previous++) {
      const picks = new Set(
        Array.from({ length: 11 }, (_, i) => randomPitchClass(previous, () => i / 11)),
      );
      expect(picks.has(previous)).toBe(false);
      expect(picks.size).toBe(11);
    }
  });
});
