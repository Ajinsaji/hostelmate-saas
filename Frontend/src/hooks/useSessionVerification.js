import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

// In-memory cache of verified tokens to avoid re-verifying the same token on every route change
let globalVerifiedToken = null;
let activeVerificationPromise = null;

export function resetSessionVerificationCache() {
  globalVerifiedToken = null;
  activeVerificationPromise = null;
}

export default function useSessionVerification() {
  const location = useLocation();

  const isPublicRoute = useMemo(() => {
    const path = location.pathname;

    // Public pages that must never be forced to /login.
    if (
      path === "/" ||
      path === "/login" ||
      path === "/owner/login" ||
      path === "/register" ||
      path === "/admin/login" ||
      path === "/admin-login" ||
      path === "/request-status" ||
      path === "/request-tracking" ||
      path === "/track-request" ||
      path === "/application-status" ||
      path === "/pending-approval"
    ) {
      return true;
    }

    // Public hostel pages: /h/:hostelCode and /hostel/:slug
    if (path.startsWith("/h/") || path.startsWith("/hostel/")) return true;
    if (path.startsWith("/request-status") || path.startsWith("/request-tracking") || path.startsWith("/track-request")) return true;

    return false;
  }, [location.pathname]);

  const token = useMemo(() => {
    const path = location.pathname;
    const isAdminRoute = path.startsWith("/admin");
    return isAdminRoute
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("ownerToken") || localStorage.getItem("token");
  }, [location.pathname]);

  const [verifying, setVerifying] = useState(() => {
    if (isPublicRoute) return false;
    if (!token) return false;
    if (globalVerifiedToken === token) return false;
    return true;
  });

  useEffect(() => {
    let mounted = true;

    // Prevent startup verification from triggering global redirects on public routes.
    if (isPublicRoute) {
      if (mounted) setVerifying(false);
      return;
    }

    if (!token) {
      if (mounted) setVerifying(false);
      return;
    }

    const path = location.pathname;
    const isAdminRoute = path.startsWith("/admin");

    // If this exact token was already verified or is actively being verified
    if (globalVerifiedToken === token) {
      const waitForInFlight = async () => {
        if (activeVerificationPromise) {
          try {
            await activeVerificationPromise;
          } catch {
            // ignore
          }
        }
        if (mounted) setVerifying(false);
      };
      waitForInFlight();
      return;
    }

    const run = async () => {
      // Admin routes must NOT call the owner verification endpoint.
      if (isAdminRoute) {
        if (mounted) setVerifying(false);
        return;
      }

      // Immediately cache token to prevent duplicate parallel executions
      globalVerifiedToken = token;

      // Deduplicate concurrently running verification promises
      if (!activeVerificationPromise) {
        activeVerificationPromise = (async () => {
          try {
            const { api } = await import("../services/api");
            await api.get("/api/auth/verify-session");
          } catch (err) {
            // Keep token marked as verified to avoid infinite retry loops on failure
          } finally {
            activeVerificationPromise = null;
          }
        })();
      }

      try {
        await activeVerificationPromise;
      } catch {
        // ignore
      }

      if (mounted) {
        setVerifying(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [token, isPublicRoute, location.pathname]);

  return { verifying };
}
