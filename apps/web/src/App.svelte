<script lang="ts">
  import IntervalPlayer from "./lib/IntervalPlayer.svelte";
  import PitchMatchGame from "./lib/PitchMatchGame.svelte";
  import PitchMonitor from "./lib/PitchMonitor.svelte";

  const VIEWS = [
    { id: "match", label: "Match pitch" },
    { id: "explore", label: "Explore" },
  ] as const;

  let view = $state<(typeof VIEWS)[number]["id"]>("match");
</script>

<main>
  <header>
    <h1>Tune</h1>
    <nav>
      {#each VIEWS as { id, label } (id)}
        <button class="tab" aria-pressed={view === id} onclick={() => (view = id)}>{label}</button>
      {/each}
    </nav>
  </header>

  {#if view === "match"}
    <PitchMatchGame />
  {:else}
    <PitchMonitor />
    <IntervalPlayer />
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 48rem;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  h1 {
    margin: 0;
  }

  nav {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }

  .tab {
    padding: 0.25rem 0.75rem;
    border: none;
    border-radius: 0.375rem;
    background: none;
    color: var(--muted);
    font: inherit;
    cursor: pointer;

    &[aria-pressed="true"] {
      background: var(--surface);
      color: var(--text);
    }
  }
</style>
