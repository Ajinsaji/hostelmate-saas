import { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/apiClient";
import { useCurrentHostel, usePendingAdmissions } from "../contexts/HostelContext";
import useIsMobile from "../hooks/useIsMobile";
import DashboardMobile from "./DashboardMobile";
import DashboardDesktop from "./DashboardDesktop";

export const Dashboard = memo(function Dashboard() {
  const navigate = useNavigate();
  const { hostel, switchHostel } = useCurrentHostel();
  const { updatePendingAdmissionsCount } = usePendingAdmissions();
  const isMobile = useIsMobile();

  const [stats, setStats] = useState({
    residents: 0,
    rooms: 0,
    occupancyRate: 0,
    pendingRent: 0,
    todayCollection: 0,
    pendingAdmissions: 0,
    newAdmissionsToday: 0,
    totalBeds: 0,
    occupiedBeds: 0,
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [ownerName, setOwnerName] = useState(() => {
    const user = JSON.parse(localStorage.getItem("ownerUser") || "null");
    return user?.ownerName || "Hostel Owner";
  });
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  const activeHostelId = hostel?.id || hostel?._id;

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/api/owner/dashboard");
      if (response.data.success) {
        const s = response.data.stats || {};
        setStats(s);
        const pCount = s.pendingAdmissions ?? 0;
        setPendingCount(pCount);
        updatePendingAdmissionsCount(pCount);

        if (response.data.owner?.ownerName) {
          setOwnerName(response.data.owner.ownerName);
        }

        if (response.data.hostel) {
          const h = response.data.hostel;
          if (!hostel?.name || hostel?.name === "Hostel" || !hostel?.id) {
            switchHostel({
              id: h._id || h.id,
              _id: h._id || h.id,
              name: h.hostelName || h.name || "",
              hostelName: h.hostelName || h.name || "",
              ...h,
            });
          }
        }
      }
    } catch (error) {
      console.warn("Unable to load dashboard stats.", error);
    }
  }, [hostel, switchHostel, updatePendingAdmissionsCount]);

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await api.get("/api/owner/subscription/dashboard");
      if (response.data?.success) {
        setSubscriptionData(response.data);
      }
    } catch (err) {
      console.warn("Unable to load subscription status.", err);
    }
  }, []);

  const fetchPendingAdmissionsCount = useCallback(async () => {
    try {
      const response = await api.get("/api/owner/admissions/pending");
      if (response.data && response.data.success) {
        const count = response.data.admissions?.length ?? 0;
        setPendingCount(count);
        updatePendingAdmissionsCount(count);
      }
    } catch (err) {
      console.warn("Could not retrieve pending admissions count", err);
    }
  }, [updatePendingAdmissionsCount]);

  const fetchWorkspaceOverview = useCallback(async () => {
    try {
      const response = await api.get("/api/v2/workspaces/overview");
      if (response.data && response.data.success) {
        setWorkspaceData(response.data);
      }
    } catch (err) {
      console.warn("Failed to load workspace overview.", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchSubscription();
    fetchWorkspaceOverview();
    fetchPendingAdmissionsCount();
  }, [activeHostelId, fetchStats, fetchSubscription, fetchWorkspaceOverview, fetchPendingAdmissionsCount]);

  const vacantRoomsCount = Math.max(0, (stats.rooms || 0) - Math.ceil(((stats.occupancyRate || 0) / 100) * (stats.rooms || 1)));

  if (isMobile) {
    return (
      <DashboardMobile
        stats={stats}
        pendingCount={pendingCount}
        workspaceData={workspaceData}
        subscriptionData={subscriptionData}
        activeHostelId={activeHostelId}
        switchHostel={switchHostel}
        vacantRoomsCount={vacantRoomsCount}
      />
    );
  }

  return (
    <DashboardDesktop
      stats={stats}
      pendingCount={pendingCount}
      workspaceData={workspaceData}
      subscriptionData={subscriptionData}
      activeHostelId={activeHostelId}
      switchHostel={switchHostel}
      vacantRoomsCount={vacantRoomsCount}
      ownerName={ownerName}
      hostel={hostel}
      navigate={navigate}
      aiSuggestionsOpen={aiSuggestionsOpen}
      setAiSuggestionsOpen={setAiSuggestionsOpen}
    />
  );
});

export default Dashboard;
