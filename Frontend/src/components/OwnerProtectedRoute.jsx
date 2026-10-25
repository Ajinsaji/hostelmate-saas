import { Navigate, useLocation } from "react-router-dom";
import RoleProtectedRoute from "./RoleProtectedRoute";
import { getAuthToken, getStoredOwner, getStoredUser } from "../utils/authToken";
import { useEffect, useState } from "react";
import useSessionVerification from "../hooks/useSessionVerification";
import PageLoader from "./PageLoader";
import { api } from "../services/api";

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
  const { verifying } = useSessionVerification();
  const payload = token ? decodeJwtPayload(token) : null;
  const storedUser = getStoredOwner() || getStoredUser();
  const ownerInfo = storedUser || payload;
  const onboardingCompleted = ownerInfo?.onboardingCompleted;

  const hasAuthenticatedOwner = !!token;

  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  // Non-blocking: check subscription via backend lightweight status.
  // If endpoint is missing, do not lock.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const response = await api.get("/api/owner/subscription-status");
        const res = {
          status: response.status,
          ok: response.status >= 200 && response.status < 300,
          json: async () => response.data,
        };

        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setSubscriptionExpired(!!(data?.isExpired || data?.subscriptionExpired));
          return;
        }

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setSubscriptionExpired(!!(data?.isExpired || data?.subscriptionExpired));
        }
      } catch (error) {
        if (error?.response?.status === 403) {
          const data = error.response.data || {};
          if (!cancelled) setSubscriptionExpired(!!(data?.isExpired || data?.subscriptionExpired));
        }
      }
    };

    if (!token || verifying) return;
    run();

    return () => {
      cancelled = true;
    };
  }, [token, verifying]);

  const isOnboardingRoute = location.pathname === "/ownerAction" || location.pathname === "/onboarding";

  if (verifying) {
    return <PageLoader />;
  }

  if (!hasAuthenticatedOwner) {
    return <Navigate to="/login" replace />;
  }

  if (onboardingCompleted !== true && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  if (subscriptionExpired && location.pathname !== "/subscription-expired") {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <RoleProtectedRoute allowedRoles={["owner", "Owner"]}>{children}</RoleProtectedRoute>;
}

