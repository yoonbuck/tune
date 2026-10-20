import { VoiceRange } from "@tune/games";

const STORAGE_KEY = "tune:voice-center";

/** Where the user tends to hum. Shared by every view and remembered across visits. */
export const voiceRange = new VoiceRange({
  initialCenter: Number(localStorage.getItem(STORAGE_KEY)) || undefined,
});

// The last event reliably delivered before a tab is closed or backgrounded, especially on mobile.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden")
    localStorage.setItem(STORAGE_KEY, String(voiceRange.center));
});
