// TEMPORARY: experimenting with the Audio Session API to stop iOS from routing output to the
// earpiece ("handset mode") while the mic is open. Choose a strategy with `?audio-session=`:
//   before  – set "play-and-record" before opening the mic (the spec's recommended usage; default)
//   after   – set "play-and-record" right after the mic opens, which reportedly kicks iOS to reroute
//   default – don't touch the audio session (previous behavior)
// See https://bugs.webkit.org/show_bug.cgi?id=218012 and https://bugs.webkit.org/show_bug.cgi?id=282939.

type Strategy = "before" | "after" | "default";

interface AudioSession {
  type: string;
}

const session = (navigator as Navigator & { audioSession?: AudioSession }).audioSession;
const param = new URLSearchParams(location.search).get("audio-session");
const strategy: Strategy = param === "after" || param === "default" ? param : "before";

/** What's in effect, for the on-page debug readout. */
export const audioSessionDebug = $state({ strategy, type: session?.type ?? "unsupported" });

function setType(type: string): void {
  if (!session) return;
  session.type = type;
  audioSessionDebug.type = session.type;
}

export function beforeMicStart(): void {
  if (strategy === "before") setType("play-and-record");
}

export function afterMicStart(): void {
  if (strategy === "after") setType("play-and-record");
}

export function afterMicStop(): void {
  if (strategy === "default") return;
  // Switching through "playback" forces iOS to reroute; otherwise output can stay in
  // lower-quality play-and-record mode after the mic closes.
  setType("playback");
  setType("auto");
}
