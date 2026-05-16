// Centralized refresh event for owner occupancy lifecycle.
// Any mutation that changes beds/rooms/residents should trigger this.

const KEY = "hostelmate:occupancyRefresh";

export function triggerOccupancyRefresh(reason = "mutation") {
  try {
    const payload = { reason, ts: Date.now() };
    window.dispatchEvent(new CustomEvent(KEY, { detail: payload }));
  } catch {
    // no-op: eventing must never break the UI
  }
}

export function subscribeOccupancyRefresh(handler) {
  const fn = (e) => handler?.(e?.detail);
  window.addEventListener(KEY, fn);
  return () => window.removeEventListener(KEY, fn);
}

