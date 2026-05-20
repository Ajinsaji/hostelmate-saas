import { useEffect, useState } from "react";
import { api } from "../services/api";
import buildFileUrl from "../utils/buildFileUrl";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import SuperadminBottomNav from "../components/SuperadminBottomNav";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";


function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loadingActionId, setLoadingActionId] = useState(null);

  const fetchRequests = async () => {
    try {
const response = await api.get("/api/admin/requests");
      setRequests(response.data.requests);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load requests.");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchRequests();
    })();
    return () => { mounted = false; };
  }, []);

  const approveRequest = async (id) => {
    setLoadingActionId(id);
    try {
      // Optimistic update: do NOT force status here; backend will be source of truth.

      const response = await api.put(`/api/admin/approve/${id}`, {});
      console.log("Approve response:", response.data);

      if (response.data?.success && response.data?.requiresSubscriptionSetup) {
        toast.success("Draft created. Setup subscription to activate.");
        navigate(`/admin/subscription-setup/${response.data.hostelId}`);
        return;
      }

      if (response.data?.success === false && response.data?.activationAlreadyStarted === true) {
        toast.success("Activation already started");
        navigate(`/admin/subscription-setup/${response.data.hostelId}`);
        return;
      }

      toast.success("✅ Hostel Approved");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to approve");
      fetchRequests(); // Revert on failure
    } finally {
      setLoadingActionId(null);
    }
  };

  const rejectRequest = async (id) => {
    setLoadingActionId(id);
    try {
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "Rejected" } : r));
await api.put(`/api/admin/reject/${id}`, {});
      toast.success("✅ Request Rejected");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to reject");
      fetchRequests(); // Revert
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const confirmed = window.confirm("Delete this request permanently?");

      if (!confirmed) return;

      setLoadingActionId(id);
      await api.delete(`/api/request/${id}`);

      toast.success("Request deleted");
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete request");
      fetchRequests();
    } finally {
      setLoadingActionId(null);
    }
  };


  const filteredRequests = requests
    .filter((r) => String(r.status || "").toLowerCase() === activeTab)
    .filter((r) => !(activeTab === "pending" && String(r.status || "").toLowerCase() === "approved"));


  return (
    <div style={{ minHeight: "100vh", background: "#081028", paddingBottom: "100px", fontFamily: "Poppins" }}>

      <div className="gradient-header mb-6" style={{ paddingBottom: "40px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px" }}>
        <h1 className="text-h1" style={{ color: "white" }}>Requests</h1>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>Manage hostel partner applications</p>
      </div>

      <div className="p-4" style={{ marginTop: "-30px" }}>
        {/* TABS */}
        <div className="flex rounded-xl p-1 shadow-sm mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

          {[{ label: "Pending", value: "pending" }, { label: "Activation Pending", value: "activation_pending" }, { label: "Approved", value: "approved" }, { label: "Rejected", value: "rejected" }].map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className="flex-1 py-2 text-sm rounded-lg transition-colors font-medium"
              style={{
                background: activeTab === t.value ? "var(--primary)" : "transparent",
                color: activeTab === t.value ? "white" : "var(--text-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* REQUEST LIST */}
        {filteredRequests.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl text-center shadow-sm" style={{ background: "rgba(11,23,57,0.55)" }}>

            No {activeTab} Requests Found
          </div>
        ) : (
          filteredRequests.map((item) => (
            <div key={item._id} className="glass-card rounded-2xl p-5 mb-4 shadow-sm relative overflow-hidden" style={{ background: "rgba(11,23,57,0.45)" }}>

              <div style={{ position: "absolute", top: 0, left: 0, width: "6px", height: "100%", background: item.status === "Approved" ? "#22c55e" : item.status === "Rejected" ? "#ef4444" : "#eab308" }} />
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-h3" style={{ color: "var(--text-main)" }}>{item.hostelName}</h3>
                <span className="text-xs px-2 py-1 rounded-full" style={{
                  background: item.status === "Approved" ? "#dcfce7" : item.status === "Rejected" ? "#fee2e2" : "#fef9c3",
                  color: item.status === "Approved" ? "#166534" : item.status === "Rejected" ? "#991b1b" : "#854d0e",
                  fontWeight: 600
                }}>
                  {item.status}
                </span>
              </div>

              <div className="text-small text-muted flex flex-col gap-1 mb-3">
                <p><strong>Owner:</strong> {item.ownerName}</p>
                <p><strong>Phone:</strong> {item.phone}</p>
                {item.ownerAddress && <p><strong>Owner Addr:</strong> {item.ownerAddress}</p>}
                {item.hostelAddress && <p><strong>Hostel Addr:</strong> {item.hostelAddress}</p>}
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {item.aadhaarFile && <a href={buildFileUrl(item.aadhaarFile)} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: "rgba(37,211,102,0.95)", background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.22)", padding: "6px 10px", borderRadius: 12, fontWeight: 800 }}>View Aadhaar</a>}

                {item.ownerPhoto && <a href={buildFileUrl(item.ownerPhoto)} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: "rgba(37,211,102,0.95)", background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.22)", padding: "6px 10px", borderRadius: 12, fontWeight: 800 }}>View Photo</a>}

                {item.licensePhoto && <a href={buildFileUrl(item.licensePhoto)} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: "rgba(37,211,102,0.95)", background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.22)", padding: "6px 10px", borderRadius: 12, fontWeight: 800 }}>View License</a>}

              </div>

              {String(item.status || "").toLowerCase() === "pending" && (
                <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <button
                    disabled={loadingActionId === item._id}
                    onClick={() => approveRequest(item._id)}
                    className="flex-1 py-3 rounded-xl flex justify-center items-center gap-2 font-medium"
                    style={{
                      background: "linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(34,197,94,0.85) 100%)",
                      color: "#fff",
                      opacity: loadingActionId === item._id ? 0.7 : 1,
                      border: "none",
                    }}
                  >
                    {loadingActionId === item._id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Approve
                  </button>
                  <button
                    disabled={loadingActionId === item._id}
                    onClick={() => rejectRequest(item._id)}
                    className="flex-1 py-3 rounded-xl flex justify-center items-center gap-2 font-medium"
                    style={{
                      background: "rgba(239,68,68,0.10)",
                      borderColor: "rgba(239,68,68,0.22)",
                      opacity: loadingActionId === item._id ? 0.7 : 1,
                      border: "1px solid rgba(239,68,68,0.22)",
                      color: "#fff",
                    }}
                  >
                    {loadingActionId === item._id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                    Reject
                  </button>
                  <button
                    disabled={loadingActionId === item._id}
                    onClick={() => handleDelete(item._id)}
                    className="flex-1 py-3 rounded-xl flex justify-center items-center gap-2 font-medium"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      borderColor: "rgba(239,68,68,0.22)",
                      opacity: loadingActionId === item._id ? 0.7 : 1,
                      border: "1px solid rgba(239,68,68,0.22)",
                      color: "#fee2e2",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}

              {String(item.status || "").toLowerCase() === "rejected" && (
                <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <button
                    disabled={loadingActionId === item._id}
                    onClick={() => approveRequest(item._id)}
                    className="flex-1 py-3 rounded-xl flex justify-center items-center gap-2 font-medium"
                    style={{
                      background: "linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(34,197,94,0.85) 100%)",
                      color: "#fff",
                      opacity: loadingActionId === item._id ? 0.7 : 1,
                      border: "none",
                    }}
                  >
                    {loadingActionId === item._id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Approve
                  </button>
                  <button
                    disabled={loadingActionId === item._id}
                    onClick={() => handleDelete(item._id)}
                    className="flex-1 py-3 rounded-xl flex justify-center items-center gap-2 font-medium"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      borderColor: "rgba(239,68,68,0.22)",
                      opacity: loadingActionId === item._id ? 0.7 : 1,
                      border: "1px solid rgba(239,68,68,0.22)",
                      color: "#fee2e2",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      <SuperadminBottomNav />
    </div>
  );
}

export default PendingRequests;
