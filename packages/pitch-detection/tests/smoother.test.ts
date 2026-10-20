import { expect, test } from "vite-plus/test";
import { PitchSmoother } from "../src/index.ts";

const FRAME_MS = 1000 / 60;

function cents(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}

/** Feed frequencies one frame apart and return every output. */
function run(
  smoother: PitchSmoother,
  inputs: (number | null)[],
  startFrame = 0,
): (number | null)[] {
  return inputs.map((frequency, i) => smoother.push(frequency, (startFrame + i) * FRAME_MS));
}

function detune(frequency: number, offsetCents: number): number {
  return frequency * 2 ** (offsetCents / 1200);
}

test("steadies jitter around a held note", () => {
  const smoother = new PitchSmoother();
  let seed = 1;
  const jittery = Array.from({ length: 120 }, () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
    return detune(440, (seed / 2 ** 31) * 30 - 15);
  });
  // Allow ~1/3 s to settle from wherever the first frame landed.
  const errors = run(smoother, jittery)
    .slice(20)
    .map((output) => Math.abs(cents(output!, 440)))
    .sort((a, b) => a - b);
  expect(errors[errors.length >> 1]).toBeLessThan(3);
  expect(errors.at(-1)).toBeLessThan(10);
});

test("ignores a single-frame octave glitch", () => {
  const smoother = new PitchSmoother();
  const outputs = run(smoother, [440, 440, 440, 440, 880, 440, 440]);
  for (const output of outputs) expect(output).toBeCloseTo(440, 6);
});

test("snaps to a new note within a few frames instead of gliding", () => {
  const smoother = new PitchSmoother();
  run(smoother, Array(10).fill(440));
  const outputs = run(smoother, Array(3).fill(494), 10);
  expect(outputs.at(-1)).toBeCloseTo(494, 6);
});

test("holds through short dropouts and clears after holdMs", () => {
  const smoother = new PitchSmoother({ holdMs: 250 });
  run(smoother, [440, 440, 440]);
  expect(smoother.push(null, 2 * FRAME_MS + 200)).toBeCloseTo(440, 6);
  expect(smoother.push(null, 2 * FRAME_MS + 300)).toBeNull();
});

test("starts fresh after clearing", () => {
  const smoother = new PitchSmoother();
  run(smoother, [440, 440, 440]);
  smoother.push(null, 1000);
  expect(smoother.push(330, 1000 + FRAME_MS)).toBeCloseTo(330, 6);
});
