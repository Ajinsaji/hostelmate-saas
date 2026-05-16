import { Navigate } from "react-router-dom";
import { getAuthToken } from "../utils/authToken";

const decodeJwtPayload = (token) => {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;
    const payload = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(
      decodeURIComponent(
        Array.from(payload)
          .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join("")
      )
    );
  } catch (error) {
    return null;
  }
};

export default function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


