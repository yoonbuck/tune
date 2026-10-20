<script lang="ts">
  import { PitchMatch, randomPitchClass } from "@tune/games";
  import { PITCH_CLASS_NAMES, shepardTone } from "@tune/theory";
  import PitchDial from "./PitchDial.svelte";
  import { PitchListener } from "./pitch-listener.svelte.ts";
  import { playback } from "./playback.svelte.ts";
  import { voiceRange } from "./voice-range.ts";

  const TONE_SECONDS = 1.5;

  let target = $state<number | null>(null);
  let round: PitchMatch | null = null;
  let progress = $state(0);
  let closeness = $state(0);
  let matched = $state(false);
  let revealed = $state(false);

  // Muted (and so not called) while our tone plays, so progress holds still until it ends.
  const listener = new PitchListener({
    onFrame(frequency, now) {
      if (!round) return;
      voiceRange.observe(frequency, now);
      ({ progress, closeness, matched } = round.update(frequency, now));
    },
  });

  $effect(() => () => listener.stop());

  // Any hint of closeness would give the answer away, so only show it once the target is known.
  const showFeedback = $derived(matched || revealed);
  const targetName = $derived(target === null ? "" : PITCH_CLASS_NAMES[target]);
  const message = $derived.by(() => {
    if (target === null) return "You'll hear a pitch. Hum it back in whatever octave is comfortable, and hold it.";
    if (playback.active) return "Listen…";
    if (matched) return revealed ? `That's ${targetName}.` : `Matched! It was ${targetName}.`;
    if (revealed) return `It was ${targetName}. Find it and hold it.`;
    return "Hum the pitch you heard and hold it steady.";
  });

  async function nextPitch() {
    if (listener.status === "idle") await listener.start();
    if (listener.status !== "listening") return;

    target = randomPitchClass(target ?? undefined);
    round = new PitchMatch(target);
    progress = 0;
    closeness = 0;
    matched = false;
    revealed = false;
    playTarget();
  }

  function playTarget() {
    if (target === null) return;
    // Center the tone on where the user tends to hum.
    playback.playTone(shepardTone(target, { center: voiceRange.center }), TONE_SECONDS);
  }
</script>

<section>
  <h2>Match the pitch</h2>
  <p class="message" aria-live="polite">{message}</p>

  <div class="actions">
    {#if target === null}
      <button class="button primary" disabled={listener.status === "starting"} onclick={nextPitch}>
        Start
      </button>
    {:else}
      <button class="button" disabled={playback.active} onclick={playTarget}>Play again</button>
      {#if !matched && !revealed}
        <button class="button" onclick={() => (revealed = true)}>Reveal</button>
      {/if}
      <button class="button" class:primary={matched || revealed} onclick={nextPitch}>
        {matched || revealed ? "Next pitch" : "Skip"}
      </button>
    {/if}
  </div>

  {#if listener.error}
    <p class="error">Couldn't access the microphone: {listener.error}</p>
  {/if}

  <PitchDial
    frequency={listener.frequency}
    placeholder={target === null ? "" : playback.active ? "Listen…" : "Hum it back"}
    target={showFeedback ? target : null}
    progress={showFeedback ? progress : 0}
    inTune={showFeedback && closeness > 0}
    dimmed={listener.status !== "listening"}
  />
</section>

<style>
  .message {
    min-height: 1.5em;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
