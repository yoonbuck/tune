<script lang="ts">
  import { PITCH_CLASS_NAMES, midiToName, nearestNote, pitchClass } from "@tune/theory";

  interface Props {
    frequency: number | null;
    /** Shown under the center when there's no pitch. */
    placeholder?: string;
    /** Shown in the center instead of the detected note, e.g. a note the app is playing. */
    label?: string;
    /** Pitch class to mark as the target. */
    target?: number | null;
    /** Pitch classes currently being played by the app, lit up on the ring. */
    sounding?: number[];
    /** 0–1, drawn as an arc inside the ring. */
    progress?: number;
    dimmed?: boolean;
    /** Whether to show the marker as in tune. Defaults to within 10¢ of the nearest semitone. */
    inTune?: boolean;
  }

  let {
    frequency,
    placeholder = "",
    label,
    target = null,
    sounding = [],
    progress = 0,
    dimmed = false,
    inTune: inTuneOverride,
  }: Props = $props();

  const RING_RADIUS = 78;

  /** Point on the ring for a (possibly fractional) pitch class, C at the top, clockwise. */
  function ringPoint(position: number): { x: number; y: number } {
    const angle = (position / 12) * 2 * Math.PI;
    return { x: RING_RADIUS * Math.sin(angle), y: -RING_RADIUS * Math.cos(angle) };
  }

  const nodes = PITCH_CLASS_NAMES.map((name, position) => ({ name, ...ringPoint(position) }));

  const reading = $derived(frequency === null ? null : nearestNote(frequency));
  const inTune = $derived(inTuneOverride ?? (reading !== null && Math.abs(reading.cents) < 10));
  const activeNode = $derived(reading ? pitchClass(reading.midi) : null);
  const marker = $derived(reading ? ringPoint(pitchClass(reading.midi + reading.cents / 100)) : null);

  function formatCents(cents: number): string {
    const rounded = Math.round(cents);
    return `${rounded > 0 ? "+" : rounded < 0 ? "−" : "±"}${Math.abs(rounded)}¢`;
  }
</script>

<svg
  class="dial"
  class:in-tune={inTune}
  class:dimmed
  viewBox="-100 -100 200 200"
  role="img"
  aria-label={reading ? `${midiToName(reading.midi)}, ${formatCents(reading.cents)}` : "No pitch"}
>
  <circle class="ring" r={RING_RADIUS} />

  {#if progress > 0}
    <circle
      class="progress"
      r="58"
      pathLength="1"
      stroke-dasharray="{progress} 1"
      transform="rotate(-90)"
    />
  {/if}

  {#each nodes as node, position (node.name)}
    <g
      class="node"
      class:active={position === activeNode}
      class:target={position === target}
      class:sounding={sounding.includes(position)}
      transform="translate({node.x} {node.y})"
    >
      <circle r="10" />
      <text>{node.name}</text>
    </g>
  {/each}

  {#if marker}
    <circle class="marker" cx={marker.x} cy={marker.y} r="14" />
  {/if}

  <text class="note" y="-2">{label ?? (reading ? midiToName(reading.midi) : "—")}</text>
  <text class="details" y="22">
    {#if reading && frequency !== null}
      {formatCents(reading.cents)} · {frequency.toFixed(1)} Hz
    {:else}
      {placeholder}
    {/if}
  </text>
</svg>

<style>
  .dial {
    display: block;
    width: 100%;
    max-width: 22rem;
    margin: 1.5rem auto 0;
    overflow: visible;
    font-variant-numeric: tabular-nums;

    &.dimmed {
      opacity: 0.5;
    }
  }

  text {
    fill: currentColor;
    text-anchor: middle;
    dominant-baseline: central;
  }

  .ring {
    fill: none;
    stroke: var(--border);
    stroke-width: 1.5;
  }

  .progress {
    fill: none;
    stroke: var(--in-tune);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .node {
    circle {
      fill: var(--surface);
      stroke: var(--border);
      stroke-width: 1.5;
    }

    text {
      font-size: 7px;
      fill: var(--muted);
    }

    &.active {
      circle {
        stroke: var(--accent);
      }

      text {
        fill: var(--text);
        font-weight: 600;
      }
    }

    &.sounding {
      circle {
        fill: color-mix(in srgb, var(--accent) 40%, var(--surface));
        stroke: var(--accent);
      }

      text {
        fill: var(--text);
        font-weight: 600;
      }
    }

    &.target {
      circle {
        fill: var(--accent);
      }

      text {
        fill: var(--bg);
        font-weight: 600;
      }
    }
  }

  .marker {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.5;
  }

  .in-tune {
    .node.active circle,
    .marker {
      stroke: var(--in-tune);
    }
  }

  .note {
    font-size: 30px;
    font-weight: 600;
  }

  .details {
    font-size: 8px;
    fill: var(--muted);
  }
</style>
