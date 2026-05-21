import { Navigate, useLocation } from "react-router-dom";
import RoleProtectedRoute from "./RoleProtectedRoute";
import { getAuthToken } from "../utils/authToken";
import { useEffect, useState } from "react";

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
  } catch {
    return null;
  }
};

export default function OwnerProtectedRoute({ children }) {
  const location = useLocation();
  const token = getAuthToken();
  const payload = token ? decodeJwtPayload(token) : null;
  const mustChangePassword = payload?.mustChangePassword;

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const onboardingCompleted = storedUser?.onboardingCompleted ?? payload?.onboardingCompleted;

  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  // Non-blocking: check subscription via backend lightweight status.
  // If endpoint is missing, do not lock.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE || "";
        const res = await fetch(`${apiBase}/api/owner/subscription-status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setSubscriptionExpired(!!data?.subscriptionExpired);
          return;
        }

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setSubscriptionExpired(!!data?.subscriptionExpired);
        }
      } catch {
        // fail open
      }
    };

    if (!token) return;
    run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isOnboardingRoute = location.pathname === "/onboarding";

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (onboardingCompleted !== true && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  if (subscriptionExpired && location.pathname !== "/subscription-expired") {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <RoleProtectedRoute allowedRoles={["owner"]}>{children}</RoleProtectedRoute>;
}

