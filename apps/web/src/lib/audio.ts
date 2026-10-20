import type { ToneComponent } from "@tune/theory";

let context: AudioContext | undefined;

/** Scheduling lead time, so the first note isn't clipped. */
export const START_DELAY_S = 0.05;

/** Shared context; browsers require a user gesture before audio can start, so create lazily. */
export function getAudioContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

/** Schedule frequencies one after another with a short attack/release to avoid clicks. */
export function synthesizeSequence(frequencies: number[], noteSeconds: number): void {
  const ctx = getAudioContext();
  const start = ctx.currentTime + START_DELAY_S;

  frequencies.forEach((frequency, i) => {
    const t = start + i * noteSeconds;
    const osc = new OscillatorNode(ctx, { type: "triangle", frequency });
    const gain = new GainNode(ctx, { gain: 0 });
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
    gain.gain.setTargetAtTime(0, t + noteSeconds - 0.15, 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + noteSeconds);
  });
}

/** Schedule sine components together as one tone, e.g. a Shepard tone. */
export function synthesizeTone(components: ToneComponent[], seconds: number): void {
  const ctx = getAudioContext();
  const t = ctx.currentTime + START_DELAY_S;
  const envelope = new GainNode(ctx, { gain: 0 });
  envelope.gain.setValueAtTime(0, t);
  envelope.gain.linearRampToValueAtTime(0.3, t + 0.05);
  envelope.gain.setTargetAtTime(0, t + seconds - 0.25, 0.06);
  envelope.connect(ctx.destination);

  for (const { frequency, amplitude } of components) {
    const osc = new OscillatorNode(ctx, { frequency });
    osc.connect(new GainNode(ctx, { gain: amplitude })).connect(envelope);
    osc.start(t);
    osc.stop(t + seconds);
  }
}
