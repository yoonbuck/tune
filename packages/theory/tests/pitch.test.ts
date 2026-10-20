import { expect, test } from "vite-plus/test";
import {
  frequencyToMidi,
  midiToFrequency,
  midiToName,
  nearestNote,
  pitchClass,
  pitchClassDifference,
} from "../src/index.ts";

test("midiToFrequency", () => {
  expect(midiToFrequency(69)).toBe(440);
  expect(midiToFrequency(81)).toBe(880);
  expect(midiToFrequency(60)).toBeCloseTo(261.626, 3);
  expect(midiToFrequency(69, 442)).toBe(442);
});

test("midiToName", () => {
  expect(midiToName(60)).toBe("C4");
  expect(midiToName(69)).toBe("A4");
  expect(midiToName(70)).toBe("B♭4");
  expect(midiToName(0)).toBe("C-1");
});

test("frequencyToMidi inverts midiToFrequency", () => {
  expect(frequencyToMidi(440)).toBe(69);
  expect(frequencyToMidi(midiToFrequency(60))).toBeCloseTo(60, 10);
  expect(frequencyToMidi(442, 442)).toBe(69);
});

test("nearestNote", () => {
  expect(nearestNote(440)).toEqual({ midi: 69, cents: 0 });

  const sharp = nearestNote(midiToFrequency(60.2));
  expect(sharp.midi).toBe(60);
  expect(sharp.cents).toBeCloseTo(20, 6);

  const flat = nearestNote(midiToFrequency(59.7));
  expect(flat.midi).toBe(60);
  expect(flat.cents).toBeCloseTo(-30, 6);
});

test("pitchClass ignores octave and keeps fractions", () => {
  expect(pitchClass(60)).toBe(0);
  expect(pitchClass(72)).toBe(0);
  expect(pitchClass(69)).toBe(9);
  expect(pitchClass(-3)).toBe(9);
  expect(pitchClass(61.25)).toBeCloseTo(1.25, 10);
  expect(pitchClass(71.9)).toBeCloseTo(11.9, 10);
});

test("pitchClassDifference wraps around the octave", () => {
  expect(pitchClassDifference(62, 60)).toBe(2);
  expect(pitchClassDifference(59, 60)).toBe(-1);
  expect(pitchClassDifference(86, 0)).toBe(2);
  expect(pitchClassDifference(71.8, 0)).toBeCloseTo(-0.2, 10);
  expect(pitchClassDifference(60.3, 72)).toBeCloseTo(0.3, 10);
  expect(pitchClassDifference(66, 60)).toBe(-6);
});
