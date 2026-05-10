import { useState } from "react";
import axios from "axios";
import { ArrowLeft, Phone, Search, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ApplicationStatusPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const checkStatus = async () => {
    try {
      setError("");
      const response = await axios.get(`http://localhost:5000/api/request/status/${phone}`);
      setData(response.data);
    } catch (error) {
      setError("No application found for this number");
      setData(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="gradient-header" style={{ paddingBottom: "100px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}>
        <button 
          className="btn-icon" 
          style={{ background: "rgba(255,255,255,0.2)", color: "white", marginBottom: "24px" }}
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>Track Status</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>Check your hostel application status</p>
      </div>

      {/* Main Content */}
      <div className="p-4" style={{ marginTop: "-60px" }}>
        <div className="glass-card animate-slide-up" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)" }}>
          
          <div className="input-group mb-6">
            <label className="input-label">Phone Number</label>
            <div style={{ position: "relative" }}>
              <Phone size={20} style={{ position: "absolute", left: "16px", top: "16px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Enter registered number"
                className="input-field"
                style={{ paddingLeft: "48px" }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-primary" onClick={checkStatus}>
            <Search size={20} /> Check Status
          </button>

          {error && (
            <div style={{ marginTop: "24px", padding: "16px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--border-radius-sm)", color: "var(--status-pending)", textAlign: "center", fontWeight: 500 }}>
              {error}
            </div>
          )}

          {data && (
            <div className="mt-4" style={{ padding: "20px", background: "var(--bg-color)", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Info size={20} color="var(--primary)" />
                  <h3 className="text-h3">Application Details</h3>
                </div>
                <span className={`badge badge-${data.status.toLowerCase()}`}>
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </span>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-body">Hostel Name</span>
                  <span style={{ fontWeight: 500, color: "var(--text-main)" }}>{data.request.hostelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body">Owner Name</span>
                  <span style={{ fontWeight: 500, color: "var(--text-main)" }}>{data.request.ownerName}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ApplicationStatusPage;