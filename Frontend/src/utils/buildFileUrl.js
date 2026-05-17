export default function buildFileUrl(path) {
  if (!path) return "";
  if (typeof path !== "string") return "";
  if (/^https?:\/\//i.test(path)) return path;

  // If path already includes uploads/ prefix, strip leading slash and append to backend base
  const cleaned = String(path).replace(/^\//, "").replace(/^uploads\//, "uploads/");

  const base = import.meta.env.VITE_API_URL || "";
  if (!base) return `/${cleaned}`;
  return `${base.replace(/\/$/, "")}/${cleaned}`;
}
