let audioEl = null;
let lastPlayAt = 0;
let playing = false;

// Soft bell sound using WebAudio so we don't depend on extra assets.
// Kept tiny to avoid autoplay blocks; if blocked, it fails silently.
export function playNotificationSound({ cooldownMs = 800 } = {}) {
  const now = Date.now();
  if (now - lastPlayAt < cooldownMs) return;
  if (playing) return;
  lastPlayAt = now;

  try {
    playing = true;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // short, soft "tick"
    osc.type = "sine";
    osc.frequency.value = 880;

    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

    osc.start(t);
    osc.stop(t + 0.2);

    osc.onended = () => {
      try {
        ctx.close?.();
      } catch (e) {}
      playing = false;
    };
  } catch (e) {
    // ignore (autoplay restrictions)
    playing = false;
  }
}

