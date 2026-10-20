import { expect, test } from "vite-plus/test";
import { INTERVALS, transpose } from "../src/index.ts";

test("INTERVALS covers unison through octave in order", () => {
  expect(INTERVALS.map((i) => i.semitones)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test("transpose", () => {
  const fifth = INTERVALS[7]!;
  expect(transpose(60, fifth)).toBe(67);
});
