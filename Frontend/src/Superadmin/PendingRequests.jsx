import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Copy, Download, Share2, Loader2 } from "lucide-react";
import SuperadminBottomNav from "../components/SuperadminBottomNav";
import toast from "react-hot-toast";

function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const [approvedData, setApprovedData] = useState(null);
  const [loadingActionId, setLoadingActionId] = useState(null);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/requests`);
      setRequests(response.data.requests);
    } catch (error) {
      console.log(error);
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
      // Optimistic update
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "Approved" } : r));
      
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/approve/${id}`);
      toast.success("✅ Hostel Approved");
      
      if (response.data.success && response.data.qrCodeUrl) {
        setApprovedData(response.data);
      }
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
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/reject/${id}`);
      toast.success("✅ Request Rejected");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to reject");
      fetchRequests(); // Revert
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const filteredRequests = requests.filter(r => r.status === activeTab);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "100px", fontFamily: "Poppins" }}>
      <div className="gradient-header mb-6" style={{ paddingBottom: "40px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px" }}>
        <h1 className="text-h1" style={{ color: "white" }}>Requests</h1>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>Manage hostel partner applications</p>
      </div>

      <div className="p-4" style={{ marginTop: "-30px" }}>
        {/* TABS */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm mb-6">
          {["Pending", "Approved", "Rejected"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-sm rounded-lg transition-colors font-medium"
              style={{
                background: activeTab === tab ? "var(--primary)" : "transparent",
                color: activeTab === tab ? "white" : "var(--text-muted)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* REQUEST LIST */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center shadow-sm text-muted">
            No {activeTab} Requests Found
          </div>
        ) : (
          filteredRequests.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm relative overflow-hidden">
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
                {item.aadhaarFile && <a href={`${import.meta.env.VITE_API_URL}/uploads/${item.aadhaarFile}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline bg-blue-50 px-2 py-1 rounded-md">View Aadhaar</a>}
                {item.ownerPhoto && <a href={`${import.meta.env.VITE_API_URL}/uploads/${item.ownerPhoto}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline bg-blue-50 px-2 py-1 rounded-md">View Photo</a>}
                {item.licensePhoto && <a href={`${import.meta.env.VITE_API_URL}/uploads/${item.licensePhoto}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline bg-blue-50 px-2 py-1 rounded-md">View License</a>}
              </div>

              {item.status === "Pending" && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    disabled={loadingActionId === item._id}
                    onClick={() => approveRequest(item._id)}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl flex justify-center items-center gap-2 font-medium"
                    style={{ opacity: loadingActionId === item._id ? 0.7 : 1 }}
                  >
                    {loadingActionId === item._id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Approve
                  </button>
                  <button
                    disabled={loadingActionId === item._id}
                    onClick={() => rejectRequest(item._id)}
                    className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl flex justify-center items-center gap-2 font-medium border border-red-100"
                    style={{ opacity: loadingActionId === item._id ? 0.7 : 1 }}
                  >
                    {loadingActionId === item._id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SUCCESS MODAL FOR QR AND CREDENTIALS */}
      {approvedData && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000, padding: "20px"
        }}>
          <div className="animate-slide-up" style={{ background: "white", padding: "24px", borderRadius: "24px", maxWidth: "400px", width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#dcfce7", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={32} color="#22c55e" />
            </div>
            <h2 style={{ color: "var(--text-main)", marginBottom: "8px", fontSize: "22px", fontWeight: "bold" }}>Approval Success!</h2>
            <p className="text-small text-muted mb-4">Credentials & QR generated.</p>
            
            <img src={`${import.meta.env.VITE_API_URL}/uploads/${approvedData.qrCodeUrl}`} alt="QR Code" style={{ width: "180px", height: "180px", margin: "0 auto", borderRadius: "12px", border: "1px solid #f1f5f9" }} />
            
            <div className="flex justify-center gap-2 mt-4">
              <a href={`${import.meta.env.VITE_API_URL}/uploads/${approvedData.qrCodeUrl}`} download className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-2 rounded-lg text-gray-700 font-medium">
                <Download size={14} /> Download QR
              </a>
              <button onClick={() => handleCopy(approvedData.publicUrl)} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-lg font-medium">
                <Copy size={14} /> Copy Link
              </button>
            </div>

            <div style={{ marginTop: "16px", textAlign: "left", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm"><strong>User:</strong> {approvedData.username}</p>
                <button onClick={() => handleCopy(approvedData.username)}><Copy size={14} className="text-gray-400" /></button>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm"><strong>Pass:</strong> {approvedData.tempPassword}</p>
                <button onClick={() => handleCopy(approvedData.tempPassword)}><Copy size={14} className="text-gray-400" /></button>
              </div>
            </div>
            <button onClick={() => setApprovedData(null)} style={{ marginTop: "20px", background: "var(--primary)", color: "white", padding: "14px", borderRadius: "12px", width: "100%", border: "none", fontWeight: 600 }}>
              Done
            </button>
          </div>
        </div>
      )}

      <SuperadminBottomNav />
    </div>
  );
}

export default PendingRequests;
