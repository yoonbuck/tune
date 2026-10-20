import { midiToFrequency, type ToneComponent } from "@tune/theory";
import { START_DELAY_S, synthesizeSequence, synthesizeTone } from "./audio.ts";

/** Keep treating the mic as hearing us briefly after our sound ends, to cover room echo. */
const ECHO_MS = 400;

/** All app sound goes through here, so views can react to what's playing. */
class Playback {
  /** MIDI notes sounding right now. Tones without a single pitch (e.g. Shepard tones) aren't listed. */
  sounding = $state<number[]>([]);
  /** Whether our own sound, or its echo, may be reaching the mic. */
  active = $state(false);

  #activeUntil = 0;
  #activeTimer: ReturnType<typeof setTimeout> | undefined;

  /** Play notes one after another. */
  playSequence(notes: number[], noteSeconds = 0.7): void {
    synthesizeSequence(
      notes.map((midi) => midiToFrequency(midi)),
      noteSeconds,
    );
    notes.forEach((midi, i) => {
      const startMs = (START_DELAY_S + i * noteSeconds) * 1000;
      setTimeout(() => this.sounding.push(midi), startMs);
      setTimeout(
        () => this.sounding.splice(this.sounding.indexOf(midi), 1),
        startMs + noteSeconds * 1000,
      );
    });
    this.#markActive((START_DELAY_S + notes.length * noteSeconds) * 1000);
  }

  /** Play sine components together as one tone. */
  playTone(components: ToneComponent[], seconds: number): void {
    synthesizeTone(components, seconds);
    this.#markActive((START_DELAY_S + seconds) * 1000);
  }

  #markActive(durationMs: number): void {
    const now = performance.now();
    this.#activeUntil = Math.max(this.#activeUntil, now + durationMs + ECHO_MS);
    this.active = true;
    clearTimeout(this.#activeTimer);
    this.#activeTimer = setTimeout(() => (this.active = false), this.#activeUntil - now);
  }
}

export const playback = new Playback();
