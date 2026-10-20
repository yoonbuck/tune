# Tune

An ear-training web app, built as a [Vite+](https://viteplus.dev) monorepo.

- **Match pitch** — hear a pitch, then hum it back in any octave and hold it. Tones are
  [Shepard-style](https://en.wikipedia.org/wiki/Shepard_tone) (sounding in every octave at once),
  centered on the range you tend to hum in.
- **Explore** — see the note you're humming on a chromatic circle, and play intervals.

Pitch detection runs entirely in the browser from the microphone.

## Layout

- `apps/web` — the Svelte app
- `packages/theory` — music theory core library
- `packages/pitch-detection` — pitch detection from raw audio samples
- `packages/games` — ear-training game logic

## Development

```bash
vp install        # install dependencies
vp run dev        # start the web app
vp run -r test    # run tests
vp run ready      # format, lint, type-check, test, and build everything
```

## Deploy

The app is a static-assets Cloudflare Worker (`apps/web/wrangler.toml`), built and deployed by
[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) on push. Build settings:

| Setting         | Value                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Root directory  | `apps/web`                                                                |
| Build command   | `pnpm install --frozen-lockfile && pnpm run build`                        |
| Deploy command  | `pnpm exec wrangler deploy`                                               |
| Preview command | `pnpm exec wrangler preview`                                              |
| Build variables | `PNPM_VERSION=12.14.0`, `NODE_VERSION=24`, `SKIP_DEPENDENCY_INSTALL=true` |

Dependencies are installed by the build command rather than automatically, so the workspace's pnpm
version and lockfile are used. To deploy manually instead, run `vp run web#deploy` after
`wrangler login`.

## License

[MIT](LICENSE)
