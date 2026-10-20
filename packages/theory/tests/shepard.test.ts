import { expect, test } from "vite-plus/test";
import { frequencyToMidi, pitchClass, shepardTone } from "../src/index.ts";

test("every component has the requested pitch class, an octave apart", () => {
  const components = shepardTone(3);
  expect(components.length).toBeGreaterThan(3);
  for (const { frequency } of components)
    expect(pitchClass(frequencyToMidi(frequency))).toBeCloseTo(3, 6);
  for (let i = 1; i < components.length; i++) {
    expect(components[i]!.frequency / components[i - 1]!.frequency).toBeCloseTo(2, 10);
  }
});

test("amplitudes sum to 1 and peak nearest the center", () => {
  const components = shepardTone(9, { center: 250 });
  expect(components.reduce((sum, c) => sum + c.amplitude, 0)).toBeCloseTo(1, 10);
  const loudest = components.reduce((a, b) => (b.amplitude > a.amplitude ? b : a));
  expect(loudest.frequency).toBeCloseTo(220, 6);
});

test("stays within the frequency bounds", () => {
  const components = shepardTone(0, { minFrequency: 100, maxFrequency: 1000, spread: 10 });
  expect(components.map((c) => Math.round(c.frequency))).toEqual([131, 262, 523]);
});

test("ignores the octave of the input", () => {
  expect(shepardTone(60)).toEqual(shepardTone(0));
});
