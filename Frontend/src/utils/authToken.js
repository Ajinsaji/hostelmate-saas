import { resetSessionVerificationCache } from "../hooks/useSessionVerification";

const OWNER_TOKEN_KEY = "ownerToken";
const ADMIN_TOKEN_KEY = "adminToken";
const OWNER_USER_KEY = "ownerUser";
const ADMIN_USER_KEY = "adminUser";

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value || "null");
  } catch {
    return null;
  }
};

export const getDeviceId = () => {
  try {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "dev-" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  } catch {
    return "dev-fallback-id";
  }
};

export const getOwnerToken = () => {
  try {
    return localStorage.getItem(OWNER_TOKEN_KEY) || localStorage.getItem("token");
  } catch {
    return null;
  }
};

export const getAdminToken = () => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getAuthToken = getOwnerToken;

export const getAnyAuthToken = () => {
  try {
    const adminUser = getStoredAdmin();
    const ownerUser = getStoredOwner();
    const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

    if (isAdminRoute && getAdminToken()) {
      return getAdminToken();
    }
    if (adminUser && getAdminToken()) {
      return getAdminToken();
    }
    if (ownerUser && getOwnerToken()) {
      return getOwnerToken();
    }
    return getOwnerToken() || getAdminToken() || null;
  } catch {
    return null;
  }
};

export const setOwnerAuth = (token) => {
  try {
    if (!token) return;
    resetSessionVerificationCache();
    localStorage.setItem(OWNER_TOKEN_KEY, token);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth_state_changed"));
    }
  } catch {
    // ignore
  }
};

export const setAdminAuth = (token) => {
  try {
    if (!token) return;
    resetSessionVerificationCache();
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth_state_changed"));
    }
  } catch {
    // ignore
  }
};

export const getStoredOwner = () => {
  return (
    safeJsonParse(localStorage.getItem(OWNER_USER_KEY)) ||
    safeJsonParse(localStorage.getItem("user")) ||
    null
  );
};

export const getStoredAdmin = () => {
  return safeJsonParse(localStorage.getItem(ADMIN_USER_KEY));
};

export const getStoredUser = () => {
  return getStoredAdmin() || getStoredOwner();
};

export const setStoredOwner = (user) => {
  try {
    if (!user) return;
    localStorage.setItem(OWNER_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const setStoredAdmin = (user) => {
  try {
    if (!user) return;
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const setStoredUser = setStoredOwner;

export const clearOwnerAuth = () => {
  try {
    resetSessionVerificationCache();
    localStorage.removeItem(OWNER_TOKEN_KEY);
    localStorage.removeItem(OWNER_USER_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("onboardingProgress");
  } catch {
    // ignore
  }
};

export const clearAdminAuth = () => {
  try {
    resetSessionVerificationCache();
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch {
    // ignore
  }
};

export const clearAuth = () => {
  try {
    clearOwnerAuth();
    clearAdminAuth();
  } catch {
    // ignore
  }
};
