import { API_BASE_URL } from "../services/api";

const BACKEND_URL = API_BASE_URL || (import.meta.env.DEV ? "" : null);

export default function buildQrUrl(qrCodeUrl) {
  if (!qrCodeUrl || typeof qrCodeUrl !== "string") return "";

  const trimmed = qrCodeUrl.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (BACKEND_URL === null) return "";
  const backend = BACKEND_URL.replace(/\/$/, "");

  if (trimmed.includes("/uploads/")) {
    // Already a server-relative uploaded path (e.g. /uploads/qr/file.png or uploads/qr/file.png)
    const cleaned = trimmed.replace(/^\//, "");
    return backend ? `${backend}/${cleaned}` : `/${cleaned}`;
  }

  // Legacy: assume QR code filename only (e.g. RMH716232G75-QR.png)
  const filename = trimmed.replace(/^\//, "");
  const qrPath = `uploads/qr/${filename}`;
  return backend ? `${backend}/${qrPath}` : `/${qrPath}`;
}

