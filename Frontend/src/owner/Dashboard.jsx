import { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/apiClient";
import { useCurrentHostel } from "../contexts/HostelContext";
import useIsMobile from "../hooks/useIsMobile";
import DashboardMobile from "./DashboardMobile";
import DashboardDesktop from "./DashboardDesktop";

export const Dashboard = memo(function Dashboard() {
  const navigate = useNavigate();
  const { hostel, switchHostel } = useCurrentHostel();
  const isMobile = useIsMobile();

  const [stats, setStats] = useState({
    residents: 0,
    rooms: 0,
    occupancyRate: 0,
    pendingRent: 0,
    todayCollection: 0,
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [ownerName, setOwnerName] = useState("Hostel Owner");
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  const activeHostelId = hostel?.id || hostel?._id;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("ownerUser") || "null");
    if (user?.ownerName) setOwnerName(user.ownerName);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/api/owner/dashboard");
      if (response.data.success) {
        setStats(response.data.stats || {});
      }
    } catch (error) {
      console.warn("Unable to load dashboard stats.", error);
    }
  }, []);

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
        setPendingCount(response.data.admissions?.length || 0);
      }
    } catch (err) {
      console.warn("Could not retrieve pending admissions count", err);
    }
  }, []);

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
