"use strict";

/**
 * Normalizes an uploaded asset path or URL.
 * Handles:
 * - Cloudinary URLs (http:// or https://)
 * - Local /uploads/ paths
 * - Plain filenames
 * - Rejects null, undefined, empty strings, and dummy placeholders
 */
function normalizeAssetUrl(rawVal) {
  if (!rawVal || typeof rawVal !== "string") return null;
  const clean = rawVal.trim();
  if (!clean) return null;

  // Reject dummy placeholders or default strings
  if (/^(default[_-]|placeholder|dummy|none|null|undefined|n\/a)/i.test(clean)) {
    return null;
  }

  // Already a full remote URL (Cloudinary, S3, etc.)
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // Detect internal server paths (/opt/render/..., C:\..., Backend/uploads/..., \uploads\...)
  if (clean.includes("/opt/render/") || clean.includes("Backend/uploads") || clean.includes("Backend\\uploads") || clean.includes("\\uploads\\") || clean.includes("c:\\") || clean.includes("C:\\")) {
    const filename = clean.split(/[/\\]/).pop();
    return filename ? `/uploads/${filename}` : null;
  }

  // Already starts with /uploads/
  if (clean.startsWith("/uploads/")) {
    return clean;
  }

  // Starts with uploads/
  if (clean.startsWith("uploads/")) {
    return "/" + clean;
  }

  // Plain filename like "172387123-photo.jpg" or path ending in filename
  const filename = clean.split(/[/\\]/).pop();
  if (filename && /^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+$/.test(filename)) {
    return `/uploads/${filename}`;
  }

  return clean;
}

/**
 * Resolves owner photograph, Aadhaar/ID proof, and license URLs
 * from any entity (HostelRequest, Hostel, Owner, or plain payload).
 */
function resolveOwnerDocuments(doc = {}) {
  if (!doc) {
    return {
      ownerPhotoUrl: null,
      aadhaarUrl: null,
      licenseUrl: null,
    };
  }

  // 1. Owner Photo Resolution
  const rawOwnerPhoto =
    doc.ownerPhotoUrl ||
    doc.ownerPhoto ||
    doc.profileImage ||
    doc.photo ||
    doc.selfie ||
    doc.avatar ||
    "";

  // 2. Aadhaar / ID Proof Resolution
  const rawAadhaar =
    doc.aadhaarUrl ||
    doc.aadhaarFile ||
    doc.aadhaarPhoto ||
    doc.aadhaarImage ||
    doc.aadhaar ||
    doc.idProofUrl ||
    doc.idProof ||
    "";

  // 3. License Certificate Resolution
  const rawLicense =
    doc.licenseUrl ||
    doc.licensePhoto ||
    doc.licenseImage ||
    doc.licenseFile ||
    doc.license ||
    doc.tradeLicense ||
    "";

  const ownerPhotoUrl = normalizeAssetUrl(rawOwnerPhoto);
  const aadhaarUrl = normalizeAssetUrl(rawAadhaar);
  const licenseUrl = normalizeAssetUrl(rawLicense);

  return {
    ownerPhotoUrl,
    aadhaarUrl,
    licenseUrl,
    hasPhoto: Boolean(ownerPhotoUrl),
    hasAadhaar: Boolean(aadhaarUrl),
    hasLicense: Boolean(licenseUrl),
    allResolved: Boolean(ownerPhotoUrl && aadhaarUrl && licenseUrl),
  };
}

module.exports = {
  normalizeAssetUrl,
  resolveOwnerDocuments,
};
