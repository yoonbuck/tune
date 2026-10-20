import { PitchSmoother, detectPitch } from "@tune/pitch-detection";
import { afterMicStart, afterMicStop, beforeMicStart } from "./audio-session.svelte.ts";
import { getAudioContext } from "./audio.ts";
import { playback } from "./playback.svelte.ts";

export interface PitchListenerOptions {
  /** Called every animation frame with the smoothed frequency (null for none). Not called while muted. */
  onFrame?: (frequency: number | null, timeMs: number) => void;
}

/**
 * Listens to the microphone and exposes the currently detected (smoothed) frequency.
 * Muted while the app's own sound is playing, so it isn't mistaken for the user.
 */
export class PitchListener {
  status = $state<"idle" | "starting" | "listening">("idle");
  frequency = $state<number | null>(null);
  error = $state<string | null>(null);

  #stream?: MediaStream;
  #source?: MediaStreamAudioSourceNode;
  #frame = 0;
  #smoother = new PitchSmoother();
  readonly #onFrame?: PitchListenerOptions["onFrame"];

  constructor(options: PitchListenerOptions = {}) {
    this.#onFrame = options.onFrame;
  }

  async start(): Promise<void> {
    if (this.status !== "idle") return;
    this.status = "starting";
    this.error = null;

    // Resume while still inside the user gesture; Safari won't allow it after the await below.
    const ctx = getAudioContext();
    void ctx.resume();
    beforeMicStart();

    let stream: MediaStream;
    try {
      // Browser voice processing distorts pitch, so ask for the raw signal.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      this.status = "idle";
      afterMicStop();
      return;
    }
    if (this.status !== "starting") {
      // stop() was called while waiting for permission.
      for (const track of stream.getTracks()) track.stop();
      afterMicStop();
      return;
    }
    afterMicStart();

    const analyser = new AnalyserNode(ctx, { fftSize: 2048 });
    this.#stream = stream;
    this.#source = new MediaStreamAudioSourceNode(ctx, { mediaStream: stream });
    this.#source.connect(analyser);
    this.status = "listening";

    const buffer = new Float32Array(analyser.fftSize);
    let wasMuted = false;
    const tick = (now: number) => {
      this.#frame = requestAnimationFrame(tick);
      if (playback.active) {
        wasMuted = true;
        this.frequency = null;
        return;
      }
      if (wasMuted) {
        // Drop anything heard just before playback started.
        wasMuted = false;
        this.#smoother.reset();
      }

      analyser.getFloatTimeDomainData(buffer);
      const estimate = detectPitch(buffer, ctx.sampleRate);
      this.frequency = this.#smoother.push(estimate?.frequency ?? null, now);
      this.#onFrame?.(this.frequency, now);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.#frame);
    this.#source?.disconnect();
    const wasOpen = this.#stream !== undefined;
    for (const track of this.#stream?.getTracks() ?? []) track.stop();
    this.#source = undefined;
    this.#stream = undefined;
    this.#smoother.reset();
    this.status = "idle";
    this.frequency = null;
    if (wasOpen) afterMicStop();
  }
}
