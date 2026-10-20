<script lang="ts">
  import { midiToName, pitchClass } from "@tune/theory";
  import PitchDial from "./PitchDial.svelte";
  import { PitchListener } from "./pitch-listener.svelte.ts";
  import { playback } from "./playback.svelte.ts";
  import { voiceRange } from "./voice-range.ts";

  const listener = new PitchListener({ onFrame: (frequency, now) => voiceRange.observe(frequency, now) });
  $effect(() => () => listener.stop());

  const sounding = $derived(playback.sounding.map(pitchClass));
  const latestNote = $derived(playback.sounding.at(-1));
</script>

<section>
  <h2>Hum a note</h2>

  <button
    class="button"
    disabled={listener.status === "starting"}
    onclick={() => (listener.status === "idle" ? listener.start() : listener.stop())}
  >
    {listener.status === "idle" ? "Start listening" : "Stop listening"}
  </button>

  {#if listener.error}
    <p class="error">Couldn't access the microphone: {listener.error}</p>
  {/if}

  <PitchDial
    frequency={listener.frequency}
    {sounding}
    label={latestNote === undefined ? undefined : midiToName(latestNote)}
    placeholder={playback.active ? "Playing…" : listener.status === "listening" ? "Listening…" : ""}
    dimmed={listener.status !== "listening" && !playback.active}
  />
</section>
