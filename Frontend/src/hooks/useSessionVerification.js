import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const verifyBase = `${import.meta.env.VITE_API_URL}/api/auth/verify-session`;

export default function useSessionVerification() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const { getAuthToken } = await import("../utils/authToken");

        const authToken = getAuthToken();



        // If no token exists, immediately stop verifying.
        if (!authToken) {
          if (!mounted) return;
          setVerifying(false);
          return;
        }

        const res = await fetch(verifyBase, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!res.ok) {
          let data = null;
          try {
            data = await res.json();
          } catch {
            // ignore
          }

          if (data?.message) {
            toast.error(data.message);
          } else {
            toast.error("Session expired. Please login again.");
          }

          const { clearAuth } = await import("../utils/authToken");
          clearAuth();

          if (!mounted) return;
          navigate("/login", { replace: true });
          return;
        }

        if (mounted) setVerifying(false);
      } catch (e) {
        // Network/server error: do not log out aggressively.
        if (mounted) {
          setVerifying(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return { verifying };
}

