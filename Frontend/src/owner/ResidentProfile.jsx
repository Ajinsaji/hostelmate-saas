import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  Activity,
  ArrowLeft,
  Briefcase,
  FileText,
  Heart,
  Users,
  BedDouble,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";

const ResidentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/residents/${id}`);
        if (res.data?.success) {
          setProfile(res.data);
        }
      } catch (err) {
        toast.error("Failed to load resident profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#081028] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!profile?.resident) {
    return (
      <div className="min-h-screen bg-[#081028] text-white p-8 text-center">
        <h2>Resident Not Found</h2>
        <button onClick={() => navigate("/residents")} className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl">
          Back to Residents
        </button>
      </div>
    );
  }

  const { resident, auditHistory } = profile;

  return (
    <div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Residents
        </button>

        {/* Profile Banner Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-3xl font-black text-white shadow-xl">
              {resident.photo ? (
                <img src={buildFileUrl(resident.photo)} alt="" className="w-full h-full object-cover" />
              ) : (
                (resident.firstName || "R")[0]
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white">{resident.fullName}</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-0.5 rounded-full font-bold">
                  {resident.status}
                </span>
              </div>
              <div className="font-mono text-emerald-400 text-xs font-bold mt-1">{resident.admissionNumber}</div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
                <span>{resident.occupation}</span>
                <span>•</span>
                <span>{resident.phone}</span>
                {resident.email && <span>• {resident.email}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Accommodation & Financials */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
              <BedDouble className="text-emerald-400" /> Accommodation & Financial Summary
            </h3>
            <div className="flex justify-between"><span className="text-slate-400">Assigned Room:</span><span className="font-bold text-white">{resident.roomId?.roomNumber ? `Room ${resident.roomId.roomNumber}` : "Unassigned"}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Assigned Bed:</span><span className="font-bold text-white">{resident.bedId?.bedNumber ? `Bed ${resident.bedId.bedNumber}` : "Unassigned"}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Monthly Rent:</span><span className="font-bold text-emerald-400 text-sm">₹{resident.monthlyRent}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Security Deposit:</span><span className="font-bold text-white">₹{resident.securityDeposit || resident.depositAmount}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Joining Date:</span><span className="text-slate-300">{new Date(resident.joiningDate || resident.joinDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Food Preference:</span><span className="text-slate-300">{resident.foodPreference}</span></div>
          </div>

          {/* Guardian & Emergency */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
              <Users className="text-blue-400" /> Guardian & Emergency Contacts
            </h3>
            <div className="flex justify-between"><span className="text-slate-400">Guardian Name:</span><span className="text-white">{resident.guardianName || "-"}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Guardian Relation:</span><span className="text-white">{resident.guardianRelation || "-"}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Guardian Phone:</span><span className="text-white">{resident.guardianPhone || "-"}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Emergency Contact:</span><span className="text-white">{resident.emergencyContactPhone || resident.emergencyContact || "-"}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Aadhaar Number:</span><span className="text-white font-mono">{resident.aadhaarNumber || "-"}</span></div>
          </div>

        </div>

        {/* Audit Timeline */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Activity className="text-purple-400" /> Resident Lifecycle Audit Timeline
          </h3>
          <div className="space-y-3">
            {auditHistory?.length > 0 ? (
              auditHistory.map((log) => (
                <div key={log._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{log.action}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{log.actionType} • {new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">No audit history recorded</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResidentProfile;
