import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle } from "lucide-react";
import BottomNav from "../components/BottomNav";
import toast from "react-hot-toast";

function PendingAdmissions() {
  const [admissions, setAdmissions] = useState([]);

  const [loadingActionId, setLoadingActionId] = useState(null);

  const fetchAdmissions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/owner/admissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setAdmissions(response.data.admissions);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleApprove = async (id) => {
    setLoadingActionId(id);
    try {
      setAdmissions(prev => prev.map(a => a._id === id ? { ...a, status: "Approved" } : a));
      await axios.put(`${import.meta.env.VITE_API_URL}/api/owner/admissions/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success("Admission Approved! Resident created.");
      fetchAdmissions();
    } catch (error) {
      toast.error("Failed to approve admission");
      fetchAdmissions();
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleReject = async (id) => {
    setLoadingActionId(id);
    try {
      setAdmissions(prev => prev.map(a => a._id === id ? { ...a, status: "Rejected" } : a));
      await axios.put(`${import.meta.env.VITE_API_URL}/api/owner/admissions/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success("Admission Rejected");
      fetchAdmissions();
    } catch (error) {
      toast.error("Failed to reject admission");
      fetchAdmissions();
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "100px" }}>
      <div className="gradient-header mb-6" style={{ paddingBottom: "30px", borderBottomLeftRadius: "20px", borderBottomRightRadius: "20px" }}>
        <h1 className="text-h1" style={{ color: "white" }}>Pending Admissions</h1>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>Review digital admission requests</p>
      </div>

      <div className="p-4 flex-col gap-4">
        {admissions.length === 0 ? (
          <div className="text-center p-8 text-muted bg-white rounded-2xl shadow-sm">No pending admissions</div>
        ) : (
          admissions.map(item => (
            <div key={item._id} className="glass-card bg-white p-5 rounded-2xl shadow-sm mb-4">
              <h3 className="text-h3" style={{ color: "var(--primary-dark)", marginBottom: "8px" }}>{item.residentName}</h3>
              <p className="text-small mb-1"><strong>Phone:</strong> {item.phone}</p>
              <p className="text-small mb-1"><strong>Emergency:</strong> {item.emergencyContact}</p>
              <p className="text-small mb-3"><strong>Status:</strong> <span style={{ color: item.status === "Pending" ? "var(--status-pending)" : "var(--primary)" }}>{item.status}</span></p>

              <div className="flex gap-2 mb-4">
                {item.idProofFile && <a href={`${import.meta.env.VITE_API_URL}/uploads/${item.idProofFile}`} target="_blank" className="text-xs text-blue-500 underline">ID Proof</a>}
                {item.photoFile && <a href={`${import.meta.env.VITE_API_URL}/uploads/${item.photoFile}`} target="_blank" className="text-xs text-blue-500 underline">Photo</a>}
                {item.signatureFile && <a href={`${import.meta.env.VITE_API_URL}/uploads/${item.signatureFile}`} target="_blank" className="text-xs text-blue-500 underline">Signature</a>}
              </div>

              {item.status === "Pending" && (
                <div className="flex gap-3 mt-4">
                  <button disabled={loadingActionId === item._id} onClick={() => handleApprove(item._id)} className="btn-primary flex-1 py-3 text-sm flex justify-center items-center gap-2" style={{ opacity: loadingActionId === item._id ? 0.7 : 1 }}>
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button disabled={loadingActionId === item._id} onClick={() => handleReject(item._id)} className="btn-secondary flex-1 py-3 text-sm flex justify-center items-center gap-2" style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", opacity: loadingActionId === item._id ? 0.7 : 1 }}>
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}

export default PendingAdmissions;
