import { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Download, Share2, Search, Building, User, Phone, CheckCircle2, ShieldAlert, Key, MessageCircle, RefreshCw } from "lucide-react";
import SuperadminBottomNav from "../components/SuperadminBottomNav";
import toast from "react-hot-toast";

function HostelManagement() {
  const [hostels, setHostels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", action: null, ownerId: null });

  const fetchHostels = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/hostels`);
      setHostels(response.data.hostels || []);
    } catch (error) {
      toast.error("Failed to load hostels");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleCopy = (text, type = "Copied") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} to clipboard!`);
  };

  const handleCopyAll = (h) => {
    const text = `Hostel: ${h.hostelName}\nLink: ${h.publicUrl}\nUsername: ${h.phone}\nPassword: ${h.tempPassword}`;
    handleCopy(text, "Credentials copied");
  };

  const handleResetPassword = async (ownerId) => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Password?",
      message: "Generate a new temporary password for this owner?",
      action: "reset",
      ownerId: ownerId
    });
  };

  const confirmResetPassword = async () => {
    const ownerId = confirmModal.ownerId;
    setConfirmModal({ isOpen: false, title: "", message: "", action: null, ownerId: null });
    setIsResetting(true);
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/hostels/${ownerId}/reset-password`);
      toast.success("New temporary password generated!");
      setHostels(prev => prev.map(h => h.ownerId === ownerId ? { ...h, tempPassword: res.data.tempPassword } : h));
      if (selectedHostel?.ownerId === ownerId) {
        setSelectedHostel(prev => ({ ...prev, tempPassword: res.data.tempPassword }));
      }
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const handleResendWhatsApp = async (ownerId) => {
    setIsResending(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/hostels/${ownerId}/resend-whatsapp`);
      if (res.data.success && res.data.whatsappURL) {
        toast.success("Opening WhatsApp...");
        // Open WhatsApp in new tab
        window.open(res.data.whatsappURL, '_blank');
      } else {
        toast.success("WhatsApp credentials ready!");
      }
    } catch (error) {
      toast.error("Failed to generate WhatsApp link");
    } finally {
      setIsResending(false);
    }
  };

  const filteredHostels = hostels.filter((h) => {
    const matchesSearch =
      (h.hostelName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.phone || "").includes(searchQuery);

    const subscriptionStatus = (h.subscriptionStatus || "").toLowerCase();

    let matchesFilter = true;
    if (filter === "active") matchesFilter = subscriptionStatus === "active";
    if (filter === "trial") matchesFilter = h.isTrial;
    if (filter === "expired") matchesFilter = subscriptionStatus === "expired";
    if (filter === "locked") matchesFilter = subscriptionStatus === "locked";

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "100px", fontFamily: "Poppins" }}>
      <div className="gradient-header mb-6" style={{ paddingBottom: "40px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px" }}>
        <h1 className="text-h1" style={{ color: "white" }}>Hostel Management</h1>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>Manage approved hostels & credentials</p>
      </div>

      <div className="p-4" style={{ marginTop: "-30px" }}>
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-3">
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search hostel or owner phone..."
              className="w-full bg-gray-50 border-none rounded-xl p-3"
              style={{ paddingLeft: "44px", fontSize: "14px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {["all", "active", "trial", "expired", "locked"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
                style={{
                  background: filter === f ? "var(--primary)" : "#f1f5f9",
                  color: filter === f ? "white" : "var(--text-muted)"
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Hostel List */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm text-muted animate-pulse">
              Loading hostels...
            </div>
          ) : filteredHostels.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm text-muted">
              No hostels found
            </div>
          ) : (
            filteredHostels.map(h => (
              <div key={h.hostelId} className="bg-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                <div style={{ position: "absolute", top: 0, left: 0, width: "6px", height: "100%", background: h.isTrial ? "#eab308" : h.subscriptionStatus === "active" ? "#22c55e" : "#ef4444" }} />
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-h3" style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Building size={16} color="var(--primary)"/> {h.hostelName}
                    </h3>
                    <p className="text-xs text-muted mt-1 flex items-center gap-1">
                      <User size={12}/> {h.ownerName} • <Phone size={12}/> {h.phone}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                    background: h.isTrial ? "#fef9c3" : h.subscriptionStatus === "active" ? "#dcfce7" : "#fee2e2",
                    color: h.isTrial ? "#854d0e" : h.subscriptionStatus === "active" ? "#166534" : "#991b1b"
                  }}>
                    {h.isTrial ? "Trial" : h.subscriptionStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 p-3 rounded-xl">
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Occupancy</p>
                    <p className="text-sm font-semibold">{h.occupancy?.occupiedBeds || 0} / {h.occupancy?.totalBeds || 0} Beds</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Public Link</p>
                    <button onClick={() => window.open(h.publicUrl, "_blank")} className="text-xs text-blue-600 font-medium truncate w-full text-left underline">
                      View Page
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelectedHostel(h)} className="flex-1 bg-green-50 text-green-700 py-3 rounded-xl font-medium flex justify-center items-center gap-2 border border-green-100">
                    <Key size={16}/> View Credentials & QR
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Credentials Modal */}
      {selectedHostel && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000, padding: "20px"
        }}>
          <div className="animate-slide-up w-full max-w-[400px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl relative">
            <button onClick={() => setSelectedHostel(null)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200">
              <ShieldAlert size={18}/> {/* Close icon proxy */}
            </button>
            
            <h2 className="text-xl font-bold mb-1 text-center">{selectedHostel.hostelName}</h2>
            <p className="text-xs text-center text-muted mb-6">Owner: {selectedHostel.ownerName}</p>

            {/* QR Section */}
            <div className="mb-6 flex flex-col items-center">
              <div className="p-2 border border-gray-100 rounded-2xl shadow-sm mb-3">
                <img src={`${import.meta.env.VITE_API_URL}/uploads/${selectedHostel.qrCodeUrl}`} alt="QR" style={{ width: 150, height: 150, borderRadius: 12 }} />
              </div>
              <div className="flex gap-2 w-full">
                <a href={`${import.meta.env.VITE_API_URL}/uploads/${selectedHostel.qrCodeUrl}`} download className="flex-1 bg-gray-50 border border-gray-200 py-2 rounded-xl flex justify-center items-center gap-2 text-xs font-semibold text-gray-700">
                  <Download size={14}/> Download QR
                </a>
                <button onClick={() => handleCopy(selectedHostel.publicUrl, "Link")} className="flex-1 bg-blue-50 border border-blue-100 text-blue-600 py-2 rounded-xl flex justify-center items-center gap-2 text-xs font-semibold">
                  <Copy size={14}/> Copy Link
                </button>
              </div>
            </div>

            {/* Credentials Section */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Username</p>
                <button onClick={() => handleCopy(selectedHostel.phone, "Username")}><Copy size={12} className="text-gray-400"/></button>
              </div>
              <p className="font-semibold text-gray-800 mb-3">{selectedHostel.phone}</p>

              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Temporary Password</p>
                <button onClick={() => handleCopy(selectedHostel.tempPassword, "Password")}><Copy size={12} className="text-gray-400"/></button>
              </div>
              <p className="font-semibold text-gray-800 flex items-center justify-between">
                {selectedHostel.tempPassword || "N/A"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => handleCopyAll(selectedHostel)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium text-sm flex justify-center items-center gap-2">
                <Copy size={16}/> Copy All Credentials
              </button>
              
                <button 
                  disabled={isResending}
                  onClick={() => handleResendWhatsApp(selectedHostel.ownerId)} 
                  className="w-full bg-[#25D366] text-white py-3 rounded-xl font-medium text-sm flex justify-center items-center gap-2"
                  style={{ opacity: isResending ? 0.7 : 1 }}
                >
                  <MessageCircle size={16}/> Resend Credentials via WhatsApp
                </button>
                <button 
                  disabled={isResetting}
                  onClick={() => handleResetPassword(selectedHostel.ownerId)} 
                  className="w-full bg-orange-50 text-orange-600 py-3 rounded-xl font-medium text-sm flex justify-center items-center gap-2 border border-orange-200"
                  style={{ opacity: isResetting ? 0.7 : 1 }}
                >
                  {isResetting ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16}/>} Generate New Temporary Password
                </button>
            </div>

            <button onClick={() => setSelectedHostel(null)} className="w-full mt-4 py-3 bg-gray-100 rounded-xl font-semibold text-gray-600">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1001, padding: "20px"
        }}>
          <div className="bg-white rounded-2xl p-6 max-w-[350px] shadow-2xl" style={{ animation: "slideUp 0.3s ease-out" }}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{confirmModal.title}</h2>
            <p className="text-gray-600 text-sm mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", action: null, ownerId: null })}
                className="flex-1 py-2 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetPassword}
                disabled={isResetting}
                className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-70"
              >
                {isResetting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SuperadminBottomNav />
    </div>
  );
}

export default HostelManagement;

