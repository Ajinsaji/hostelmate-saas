export default function buildFileUrl(filePath) {
  if (!filePath) return "";
  if (typeof filePath !== "string") return "";

  const trimmed = filePath.trim();
  if (!trimmed) return "";

  // 1. Cloudinary / Absolute HTTPS URL -> return unchanged
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // 2. Internal server path (/opt/render/..., C:\..., Backend/uploads/...) -> extract filename
  let cleanPath = trimmed;
  if (cleanPath.includes("/opt/render/") || cleanPath.includes("Backend/uploads") || cleanPath.includes("Backend\\uploads") || cleanPath.includes("\\uploads\\") || cleanPath.includes("c:\\") || cleanPath.includes("C:\\")) {
    const filename = cleanPath.split(/[/\\]/).pop();
    cleanPath = filename ? `uploads/${filename}` : cleanPath;
  }

  // 3. Strip leading slash & normalize "uploads/" prefix
  const cleaned = String(cleanPath).replace(/^\//, "").replace(/^uploads\//, "uploads/");

  const base = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "");

  if (!base) return `/${cleaned}`;
  return `${base.replace(/\/$/, "")}/${cleaned}`;
}
