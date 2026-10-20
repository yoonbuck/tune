// TEMPORARY: experimenting with the Audio Session API to stop iOS from routing output to the
// earpiece ("handset mode") while the mic is open. Choose a strategy with `?audio-session=`:
//   before  – set "play-and-record" before opening the mic (the spec's recommended usage; default)
//   after   – switch to "play-and-record" right after the mic opens, which kicks iOS to reroute
//   default – don't touch the audio session (previous behavior)
// See https://bugs.webkit.org/show_bug.cgi?id=218012 and https://bugs.webkit.org/show_bug.cgi?id=282939.

type Strategy = "before" | "after" | "default";

interface AudioSession extends EventTarget {
  type: string;
  readonly state?: string;
}

const session = (navigator as Navigator & { audioSession?: AudioSession }).audioSession;
const param = new URLSearchParams(location.search).get("audio-session");
const strategy: Strategy = param === "after" || param === "default" ? param : "before";

/** When to kick again after a permission prompt, since iOS reroutes once it's dismissed. */
const REKICK_DELAYS_MS = [300, 1000];

/** What's in effect, for the on-page debug readout. */
export const audioSessionDebug = $state({
  strategy,
  type: session?.type ?? "unsupported",
  state: session?.state ?? "unknown",
});
session?.addEventListener(
  "statechange",
  () => (audioSessionDebug.state = session.state ?? "unknown"),
);

let permissionPrompted: Promise<boolean> = Promise.resolve(false);
let rekickTimers: ReturnType<typeof setTimeout>[] = [];
/** Bumped whenever the mic opens or closes, so late callbacks from an earlier session do nothing. */
let micSession = 0;

function setType(type: string): void {
  if (!session) return;
  session.type = type;
  audioSessionDebug.type = session.type;
}

/** Moving into "play-and-record" while the mic is live makes iOS reroute output to the speaker. */
function kick(): void {
  setType("auto");
  setType("play-and-record");
}

export function beforeMicStart(): void {
  // Checked up front, since by the time the mic opens the answer is always "granted".
  permissionPrompted =
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((status) => status.state === "prompt")
      .catch(() => true) ?? Promise.resolve(true);

  if (strategy === "before") setType("play-and-record");
}

export function afterMicStart(): void {
  const current = ++micSession;
  if (strategy !== "after") return;
  kick();
  void permissionPrompted.then((prompted) => {
    if (prompted && current === micSession) {
      rekickTimers = REKICK_DELAYS_MS.map((delay) => setTimeout(kick, delay));
    }
  });
}

export function afterMicStop(): void {
  micSession++;
  for (const timer of rekickTimers) clearTimeout(timer);
  rekickTimers = [];
  if (strategy === "default") return;
  // Switching through "playback" forces iOS to reroute; otherwise output can stay in
  // lower-quality play-and-record mode after the mic closes.
  setType("playback");
  setType("auto");
}
