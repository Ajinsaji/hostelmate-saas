// Lightweight data helpers for Dashboard.

export const getOwnerInitials = (name = "") => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "H";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const formatDate = (d) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const formatTime = (d) =>
  d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

