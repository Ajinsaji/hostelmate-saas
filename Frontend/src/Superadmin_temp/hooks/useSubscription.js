import { useState, useEffect } from "react";
import hostelDetailsMock from "../constants/mocks/hostelDetails.json";

export function useSubscription(hostelId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData({
          planName: hostelDetailsMock.plan,
          residentLimit: "150 beds",
          currentResidents: hostelDetailsMock.residents,
          renewalDate: "2026-12-31",
          isTrial: false,
          freeAccessOverride: false,
          history: [
            { id: 1, action: "Upgraded Plan", plan: "Pro Plan", price: "₹4,200/mo", date: "2026-07-01", status: "Active" },
            { id: 2, action: "Onboarded Trial", plan: "Basic Trial", price: "₹0/mo", date: "2026-06-15", status: "Completed" }
          ]
        });
      } catch (err) {
        setError(err.message || "Failed to load subscription status");
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [hostelId]);

  return { data, loading, error };
}

export default useSubscription;
