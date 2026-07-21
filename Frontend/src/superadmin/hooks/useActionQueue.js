import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";

export function useActionQueue() {
  const [data, setData] = useState({
    workQueue: [],
    requests: [],
    improvements: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // We will attempt to fetch from available endpoints
      const [requestsRes, supportRes] = await Promise.allSettled([
        api.get("/api/admin/requests"),
        api.get("/api/admin/support")
      ]);

      let rawRequests = [];
      let rawSupport = [];

      if (requestsRes.status === "fulfilled" && requestsRes.value.data.success) {
        rawRequests = requestsRes.value.data.requests || [];
      }
      
      if (supportRes.status === "fulfilled" && supportRes.value.data.success) {
        rawSupport = supportRes.value.data.tickets || [];
      }

      // 1. Requests Center
      const mappedRequests = rawRequests.map(r => ({
        id: r._id,
        type: "request",
        title: "Hostel Registration",
        subtitle: r.hostelName,
        owner: r.ownerName,
        phone: r.phone,
        status: r.status, // "pending", "approved", "rejected"
        priority: "High",
        timestamp: r.createdAt
      }));

      // 2. Improvement Center (Support Tickets)
      const mappedImprovements = rawSupport.map(t => ({
        id: t._id,
        type: "ticket",
        title: t.title,
        subtitle: t.category, // Feature Request, Technical, Billing
        owner: t.createdBy?.name || "Unknown",
        status: t.status, // Open, In Progress, Resolved
        priority: t.priority, // High, Medium, Low
        timestamp: t.createdAt
      }));

      // 3. Today's Work Queue (Aggregated & Categorized)
      // We take pending requests and open tickets
      const pendingReqs = mappedRequests.filter(r => r.status === "pending").map(r => ({
        ...r, queueCategory: "Needs Approval"
      }));
      
      const highPriorityTickets = mappedImprovements.filter(t => t.status === "Open" && (t.priority === "High" || t.priority === "Critical")).map(t => ({
        ...t, queueCategory: "Needs Attention"
      }));

      const otherTickets = mappedImprovements.filter(t => t.status === "Open" && t.priority !== "High" && t.priority !== "Critical").map(t => ({
        ...t, queueCategory: "Platform Improvements"
      }));

      // Activity log from tickets & requests (for Activity Timeline)
      const allActivity = [...mappedRequests, ...mappedImprovements]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      setData({
        workQueue: [...pendingReqs, ...highPriorityTickets, ...otherTickets],
        requests: mappedRequests,
        improvements: mappedImprovements,
        recentActivity: allActivity
      });

    } catch (err) {
      setError(err.message || "Failed to load action queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, error, refetch: fetchData };
}

export default useActionQueue;
