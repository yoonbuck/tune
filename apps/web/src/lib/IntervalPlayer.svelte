<script lang="ts">
  import { INTERVALS, midiToName, transpose, type Interval } from "@tune/theory";
  import { playback } from "./playback.svelte.ts";

  const root = 60;

  function play(interval: Interval) {
    playback.playSequence([root, transpose(root, interval)]);
  }
</script>

<section>
  <h2>Intervals above {midiToName(root)}</h2>

  <ul class="intervals">
    {#each INTERVALS as interval (interval.semitones)}
      <li>
        <button onclick={() => play(interval)}>
          <strong>{interval.short}</strong>
          <span>{interval.name}</span>
          <small>{midiToName(root)} → {midiToName(transpose(root, interval))}</small>
        </button>
      </li>
    {/each}
  </ul>
</section>

<style>
  .intervals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: 0.75rem;
    padding: 0;
    list-style: none;
  }

  button {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--surface);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:hover {
      border-color: var(--accent);
    }
  }

  strong {
    font-size: 1.25rem;
  }

  small {
    color: var(--muted);
  }
</style>
