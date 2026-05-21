export const getAuthToken = () => {
  try {
    return localStorage.getItem("token") || localStorage.getItem("adminToken");
  } catch {
    return null;
  }
};

export const setAuthToken = (token, { type = "token" } = {}) => {
  try {
    if (!token) return;
    localStorage.setItem(type, token);
  } catch {
    // ignore
  }
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (!user) return;
    localStorage.setItem("user", JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
  } catch {
    // ignore
  }
};

