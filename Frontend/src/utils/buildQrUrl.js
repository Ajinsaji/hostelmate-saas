export default function buildQrUrl(qrCodeUrl) {
  if (!qrCodeUrl) return "";

  if (
    typeof qrCodeUrl === "string" &&
    (qrCodeUrl.startsWith("http://") || qrCodeUrl.startsWith("https://"))
  ) {
    return qrCodeUrl;
  }

  return `${import.meta.env.VITE_API_URL}/uploads/${qrCodeUrl}`;
}

