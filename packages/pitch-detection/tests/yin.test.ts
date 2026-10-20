import { describe, expect, test } from "vite-plus/test";
import { detectPitch } from "../src/index.ts";

const SAMPLE_RATE = 48_000;
const BUFFER_SIZE = 2048;

/** Sum of harmonics; `amplitudes[0]` is the fundamental. */
function tone(frequency: number, amplitudes = [1], sampleRate = SAMPLE_RATE): Float32Array {
  const samples = new Float32Array(BUFFER_SIZE);
  const total = amplitudes.reduce((a, b) => a + b, 0);
  for (let i = 0; i < samples.length; i++) {
    let value = 0;
    amplitudes.forEach((amplitude, h) => {
      value += amplitude * Math.sin((2 * Math.PI * frequency * (h + 1) * i) / sampleRate);
    });
    samples[i] = (0.5 * value) / total;
  }
  return samples;
}

function centsBetween(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}

describe("detectPitch", () => {
  test.each([82.41, 110, 196, 261.63, 440, 880])("detects a %f Hz sine", (frequency) => {
    const estimate = detectPitch(tone(frequency), SAMPLE_RATE);
    expect(estimate).not.toBeNull();
    expect(Math.abs(centsBetween(estimate!.frequency, frequency))).toBeLessThan(5);
    expect(estimate!.clarity).toBeGreaterThan(0.9);
  });

  test.each([110, 220, 440])("detects the fundamental of a %f Hz harmonic tone", (frequency) => {
    const estimate = detectPitch(tone(frequency, [1, 0.8, 0.6, 0.4, 0.2]), SAMPLE_RATE);
    expect(Math.abs(centsBetween(estimate!.frequency, frequency))).toBeLessThan(5);
  });

  test("works at 44.1 kHz", () => {
    const estimate = detectPitch(tone(220, [1], 44_100), 44_100);
    expect(Math.abs(centsBetween(estimate!.frequency, 220))).toBeLessThan(5);
  });

  test("returns null for silence", () => {
    expect(detectPitch(new Float32Array(BUFFER_SIZE), SAMPLE_RATE)).toBeNull();
    expect(
      detectPitch(
        tone(220).map((s) => s * 0.001),
        SAMPLE_RATE,
      ),
    ).toBeNull();
  });

  test("returns null for white noise", () => {
    let seed = 1;
    const noise = new Float32Array(BUFFER_SIZE).map(() => {
      seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
      return seed / 2 ** 30 - 1;
    });
    expect(detectPitch(noise, SAMPLE_RATE)).toBeNull();
  });

  test("returns null when the buffer is too short for minFrequency", () => {
    expect(detectPitch(tone(220).subarray(0, 64), SAMPLE_RATE)).toBeNull();
  });
});
