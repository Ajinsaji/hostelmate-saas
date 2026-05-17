import buildFileUrl from "./buildFileUrl";

export default function buildQrUrl(qrCodeUrl) {
  if (!qrCodeUrl) return "";

  if (typeof qrCodeUrl === "string" && /^https?:\/\//i.test(qrCodeUrl)) {
    return qrCodeUrl;
  }

  return buildFileUrl(qrCodeUrl);
}

