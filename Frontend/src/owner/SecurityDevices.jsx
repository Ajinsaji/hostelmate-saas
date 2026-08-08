import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import useIsMobile from "../hooks/useIsMobile";
import SecurityDevicesMobile from "./SecurityDevicesMobile";
import SecurityDevicesDesktop from "./SecurityDevicesDesktop";

export default function SecurityDevices() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState(null);

  // Modal states
  const [confirmSingleModal, setConfirmSingleModal] = useState(null); // session object
  const [confirmOthersModal, setConfirmOthersModal] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/owner/sessions");
      if (response.data?.success && Array.isArray(response.data.sessions)) {
        setSessions(response.data.sessions);
      } else {
        toast.error("Failed to load active sessions");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch active sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const currentSession = sessions.find((s) => s.currentSession) || sessions[0] || null;
  const otherSessions = sessions.filter((s) => !s.currentSession);

  // Handle single device revocation
  const handleConfirmSingleRevoke = async () => {
    if (!confirmSingleModal) return;
    const { sessionId } = confirmSingleModal;
    setRevokingSessionId(sessionId);

    try {
      const res = await api.post(`/api/owner/sessions/${sessionId}/revoke`);
      if (res.data?.success) {
        toast.success(res.data.message || "Device signed out successfully");
        setConfirmSingleModal(null);
        fetchSessions();
      } else {
        toast.error(res.data?.message || "Failed to sign out device");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to sign out device");
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Handle revoke all other devices
  const handleConfirmRevokeOthers = async () => {
    setRevokingAll(true);
    try {
      const res = await api.post("/api/owner/sessions/revoke-others");
      if (res.data?.success) {
        toast.success(res.data.message || "Signed out all other devices successfully");
        setConfirmOthersModal(false);
        fetchSessions();
      } else {
        toast.error(res.data?.message || "Failed to sign out other devices");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to sign out other devices");
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <>
      {isMobile ? (
        <SecurityDevicesMobile
          sessions={sessions}
          currentSession={currentSession}
          otherSessions={otherSessions}
          loading={loading}
          onBack={() => navigate("/profile")}
          onRevokeSingle={(session) => setConfirmSingleModal(session)}
          onRevokeOthers={() => setConfirmOthersModal(true)}
          revokingSessionId={revokingSessionId}
        />
      ) : (
        <SecurityDevicesDesktop
          sessions={sessions}
          currentSession={currentSession}
          otherSessions={otherSessions}
          loading={loading}
          onRefresh={fetchSessions}
          onRevokeSingle={(session) => setConfirmSingleModal(session)}
          onRevokeOthers={() => setConfirmOthersModal(true)}
          revokingSessionId={revokingSessionId}
        />
      )}

      {/* MODAL 1: Single Device Logout Confirmation */}
      {confirmSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-white">
            <h3 className="text-lg font-black text-white">Sign out this device?</h3>
            <p className="text-xs text-slate-300">
              This will end the HostelMate session on <strong className="text-white">{confirmSingleModal.deviceName}</strong> ({confirmSingleModal.browser} • {confirmSingleModal.operatingSystem}).
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSingleModal(null)}
                disabled={!!revokingSessionId}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:text-white transition min-h-[48px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleRevoke}
                disabled={!!revokingSessionId}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {revokingSessionId ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Revoke All Other Devices Confirmation */}
      {confirmOthersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-white">
            <h3 className="text-lg font-black text-rose-400">Sign out all other devices?</h3>
            <p className="text-xs text-slate-300">
              All other HostelMate sessions across phones, laptops, and tablets will be ended immediately. You will remain signed in on this current device.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOthersModal(false)}
                disabled={revokingAll}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:text-white transition min-h-[48px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeOthers}
                disabled={revokingAll}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {revokingAll ? "Signing out..." : "Sign Out All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
