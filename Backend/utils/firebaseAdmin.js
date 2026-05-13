const admin = require("firebase-admin");

let initialized = false;

function getServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    // If env var stored as already-parsed object (unlikely), just rethrow.
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON (must be JSON string)");
  }
}

function initFirebaseAdmin() {
  if (initialized) return admin;

  const serviceAccount = getServiceAccountFromEnv();
  if (!serviceAccount) {
    // Keep app running even if Firebase not configured yet.
    return null;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  initialized = true;
  return admin;
}

function getMessaging() {
  const fb = initFirebaseAdmin();
  if (!fb) return null;
  return fb.messaging();
}

module.exports = { initFirebaseAdmin, getMessaging };

