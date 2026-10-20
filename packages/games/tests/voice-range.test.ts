import { expect, test } from "vite-plus/test";
import { VoiceRange } from "../src/index.ts";

const FRAME_MS = 10;

/** Feed frequencies from `next()` every frame for `durationMs`, starting at `fromMs`. */
function hum(
  range: VoiceRange,
  next: (frame: number) => number | null,
  fromMs: number,
  durationMs: number,
) {
  for (let frame = 0; frame * FRAME_MS <= durationMs; frame++) {
    range.observe(next(frame), fromMs + frame * FRAME_MS);
  }
}

function octavesBetween(a: number, b: number): number {
  return Math.log2(a / b);
}

test("starts at the initial center", () => {
  expect(new VoiceRange({ initialCenter: 300 }).center).toBeCloseTo(300, 6);
});

test("moves ~63% of the way to a new register after adaptMs of humming", () => {
  const range = new VoiceRange({ initialCenter: 400, adaptMs: 1000 });
  hum(range, () => 100, 0, 1000);
  // Two octaves away; expect 1 − e⁻¹ of that, measured in octaves.
  expect(octavesBetween(400, range.center)).toBeCloseTo(2 * (1 - Math.exp(-1)), 2);
});

test("settles between octaves rather than on one", () => {
  const range = new VoiceRange({ initialCenter: 600, adaptMs: 500 });
  hum(range, (frame) => (frame % 2 ? 150 : 300), 0, 10_000);
  // Within a few cents; the last few frames pull it slightly toward whichever came last.
  expect(Math.abs(octavesBetween(range.center, Math.sqrt(150 * 300)) * 1200)).toBeLessThan(10);
});

test("ignores silence and frequencies outside the voice range", () => {
  const range = new VoiceRange({ initialCenter: 250, adaptMs: 500 });
  hum(range, (frame) => [null, 30, 3000][frame % 3]!, 0, 5000);
  expect(range.center).toBeCloseTo(250, 6);
});

test("does not count gaps between frames as humming", () => {
  const range = new VoiceRange({ initialCenter: 400, adaptMs: 1000 });
  range.observe(100, 0);
  range.observe(100, 60_000);
  expect(octavesBetween(400, range.center)).toBeCloseTo(2 * (1 - Math.exp(-0.1)), 6);
});
