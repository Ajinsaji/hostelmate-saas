export const OCCUPANCY_STYLES = {
  occupied: {
    bg: "bg-green-900",
    border: "border-green-700",
    text: "text-green-200",
    label: "Occupied",
  },
  vacant: {
    bg: "bg-red-900",
    border: "border-red-700",
    text: "text-red-200",
    label: "Vacant",
  },
};

export function getOccupancyState(status) {
  const s = String(status || "").toLowerCase();
  return s === "occupied" ? "occupied" : "vacant";
}

export function getOccupancyStyle(status) {
  const state = getOccupancyState(status);
  return OCCUPANCY_STYLES[state];
}

export function getOccupancyChipClasses(status) {
  const occ = getOccupancyStyle(status);
  return `${occ.bg} ${occ.border} ${occ.text}`;
}

export function getOccupancyChipInline(status) {
  // When we can't use Tailwind classes (inline styles), map to readable RGBA
  const state = getOccupancyState(status);
  if (state === "occupied") {
    return {
      backgroundColor: "rgba(2,132,199,0.18)", // subtle teal layer behind green look
      borderColor: "rgba(22,163,74,0.95)",
      color: "rgba(187,247,208,0.95)",
    };
  }
  return {
    backgroundColor: "rgba(220,38,38,0.14)",
    borderColor: "rgba(239,68,68,0.95)",
    color: "rgba(254,202,202,0.95)",
  };
}

