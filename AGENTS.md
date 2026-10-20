# Tune

An ear-training web app.

## Layout

- `apps/web` — Svelte 5 + Vite SPA (`vp run dev` from the root). Type-check with `vp run web#check` (svelte-check).
  - All sound must go through `src/lib/playback.svelte.ts`: it tracks what's sounding, and `PitchListener` mutes the mic while `playback.active` so the app never hears itself.
  - `src/lib/voice-range.ts` holds the one shared `VoiceRange` (persisted to `localStorage`); views that listen should feed it.
- `packages/theory` (`@tune/theory`) — framework-free music theory primitives (pitches, pitch classes, intervals, Shepard-tone components). Source-only: its `exports` point at `src/index.ts`, so the app consumes it without a build step and edits hot-reload. Keep it free of DOM/audio/Svelte code; tests live in `tests/`.
- `packages/pitch-detection` (`@tune/pitch-detection`) — framework-free pitch detection (YIN) over raw `Float32Array` samples, plus `PitchSmoother` for steadying the per-frame stream for display. Same source-only setup and no-DOM rule; Web Audio/microphone wiring lives in the app (`apps/web/src/lib/pitch-listener.svelte.ts`).
- `packages/games` (`@tune/games`) — framework-free game logic (e.g. `PitchMatch` rounds and the `VoiceRange` register tracker, both fed one frame at a time). Same source-only setup and no-DOM rule; the Svelte UI for each game lives in `apps/web/src/lib`.

Run `vp run ready` before considering a change done.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
