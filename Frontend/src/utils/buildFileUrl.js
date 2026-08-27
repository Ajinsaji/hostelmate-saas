export default function buildFileUrl(filePath) {
  if (!filePath) return "";
  if (typeof filePath !== "string") return "";

  const trimmed = filePath.trim();
  if (!trimmed) return "";

  // 1. Cloudinary / Absolute HTTPS URL -> return unchanged
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // 2. Extract base filename if an internal disk path or backslash path was received
  let filename = trimmed;
  if (
    filename.includes("/opt/render/") ||
    filename.includes("Backend/uploads") ||
    filename.includes("Backend\\uploads") ||
    filename.includes("\\uploads\\") ||
    filename.includes("c:\\") ||
    filename.includes("C:\\") ||
    filename.includes("\\")
  ) {
    filename = filename.split(/[/\\]/).pop() || filename;
  }

  // 3. Strip leading slashes and any leading "uploads/" segment
  let cleanedName = String(filename).replace(/^\//, "").replace(/^uploads[/\\]/, "");

  if (cleanedName.startsWith("uploads/")) {
    cleanedName = cleanedName.replace(/^uploads\//, "");
  }

  const relativePath = `uploads/${cleanedName}`;

  const base = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "");

  if (!base) return `/${relativePath}`;
  return `${base.replace(/\/$/, "")}/${relativePath}`;
}
