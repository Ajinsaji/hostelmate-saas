export default function buildQrUrl(qrCodeUrl) {
  if (!qrCodeUrl) return "";

  if (
    typeof qrCodeUrl === "string" &&
    (qrCodeUrl.startsWith("http://") || qrCodeUrl.startsWith("https://"))
  ) {
    return qrCodeUrl;
  }

  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const path = String(qrCodeUrl || "").replace(/^\//, "");

  return `${baseUrl}/uploads/${path}`;
}

