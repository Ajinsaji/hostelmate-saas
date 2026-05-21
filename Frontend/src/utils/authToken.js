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

export const setOwnerAuth = (token) => {
  try {
    if (!token) return;
    localStorage.setItem(OWNER_TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const setAdminAuth = (token) => {
  try {
    if (!token) return;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const getStoredOwner = () => {
  return (
    safeJsonParse(localStorage.getItem(OWNER_USER_KEY)) ||
    safeJsonParse(localStorage.getItem("user"))
  );
};

export const getStoredAdmin = () => {
  return safeJsonParse(localStorage.getItem(ADMIN_USER_KEY));
};

export const getStoredUser = getStoredOwner;

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
    localStorage.removeItem(OWNER_TOKEN_KEY);
    localStorage.removeItem(OWNER_USER_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {
    // ignore
  }
};

export const clearAdminAuth = () => {
  try {
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

