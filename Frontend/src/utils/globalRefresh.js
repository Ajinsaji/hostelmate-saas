const KEY = "hostelmate:globalRefresh";

export function triggerGlobalRefresh(reason = "mutation") {
  try {
    const payload = { reason, ts: Date.now() };
    window.dispatchEvent(new CustomEvent(KEY, { detail: payload }));
  } catch {
    // no-op: refresh must never break the UI
  }
}

export function subscribeGlobalRefresh(handler) {
  const fn = (event) => handler?.(event?.detail);
  window.addEventListener(KEY, fn);
  return () => window.removeEventListener(KEY, fn);
}

export function isSafeToRefresh({
  isEditing = false,
  isSubmitting = false,
  showModal = false,
  isUploading = false,
  ...otherProps
} = {}) {
  if (isEditing || isSubmitting || showModal || isUploading) return false;

  for (const value of Object.values(otherProps)) {
    if (value === true) {
      return false;
    }
  }

  if (
    typeof document !== "undefined" &&
    document.activeElement?.matches("input, textarea, select")
  ) {
    return false;
  }

  return true;
}
