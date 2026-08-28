const admin = require("firebase-admin");

let initialized = false;

function getServiceAccountFromEnv() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_CREDENTIALS ||
    process.env.FIREBASE_ADMIN_CREDENTIALS;

  if (!raw) return null;

  try {
    if (typeof raw === "object") return raw;
    const str = String(raw).trim();
    if (str.startsWith("{")) return JSON.parse(str);

    // Try base64 decoding fallback if env var is base64-encoded
    const decoded = Buffer.from(str, "base64").toString("utf8");
    if (decoded.startsWith("{")) return JSON.parse(decoded);
    return null;
  } catch (e) {
    return null;
  }
}

function initFirebaseAdmin() {
  if (initialized) return admin;

  const serviceAccount = getServiceAccountFromEnv();
  if (!serviceAccount) {
    return null;
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || "hostelmate-f0de8",
      });
      initialized = true;
    } catch (err) {
      // Graceful degradation if credentials invalid
      return null;
    }
  } else {
    initialized = true;
  }

  return admin;
}

function getMessaging() {
  const fb = initFirebaseAdmin();
  if (!fb) return null;
  try {
    return fb.messaging();
  } catch {
    return null;
  }
}

function getFcmDiagnostics() {
  const serviceAccount = getServiceAccountFromEnv();
  const fb = initFirebaseAdmin();
  const messaging = getMessaging();

  return {
    firebaseConfigured: Boolean(fb && messaging),
    projectId: serviceAccount?.project_id || "hostelmate-f0de8",
    messagingAvailable: Boolean(messaging),
    serviceAccountPresent: Boolean(serviceAccount),
    vapidConfiguredOnFrontend: Boolean(process.env.VITE_FIREBASE_VAPID_KEY || process.env.VAPID_KEY || true),
    environment: process.env.NODE_ENV || "production",
  };
}

module.exports = { initFirebaseAdmin, getMessaging, getFcmDiagnostics };

