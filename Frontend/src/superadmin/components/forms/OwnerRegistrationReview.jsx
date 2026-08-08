import React from "react";
import { User, Shield, Building2, FileCheck, CheckCircle2, AlertTriangle, Eye, Info } from "lucide-react";

export const OwnerRegistrationReview = ({
  formData,
  onSubmit,
  loading,
  error,
}) => {
  const maskDocNumber = (num = "") => {
    if (!num) return "Not Specified";
    const cleaned = String(num).replace(/\s+/g, "");
    if (cleaned.length >= 8) {
      return `XXXX XXXX ${cleaned.slice(-4)}`;
    }
    return `XXXX ${cleaned.slice(-3)}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-300">
        <Info size={18} className="shrink-0 mt-0.5 text-emerald-400" />
        <div>
          <span className="font-bold block text-white mb-0.5">Canonical Registration Lifecycle</span>
          This creates a pending registration request. Owner account creation & final activation happen ONLY after Superadmin approval and subscription setup.
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-red-300">
          <AlertTriangle size={18} className="shrink-0 text-[#EF4444]" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Owner Details Card */}
        <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#202B45] pb-3">
            <User size={16} /> Owner Information
          </div>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Full Name:</span>
              <span className="font-bold text-white">{formData.ownerName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone Number:</span>
              <span className="font-bold text-white">{formData.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Alternate Phone:</span>
              <span className="font-medium text-slate-300">{formData.altPhone || "None"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-medium text-slate-300">{formData.email || "None"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Address:</span>
              <span className="font-medium text-slate-300 text-right max-w-[200px] truncate">{formData.ownerAddress || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Identity & KYC Card */}
        <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#202B45] pb-3">
            <Shield size={16} /> Identity & KYC Verification
          </div>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Document Type:</span>
              <span className="font-bold text-white">{formData.idType || "Aadhaar"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Masked ID Number:</span>
              <span className="font-mono text-emerald-400 font-bold">{maskDocNumber(formData.idNumber)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Owner Photo / Selfie:</span>
              <span className={`font-bold ${formData.selfie || formData.ownerPhoto ? "text-emerald-400" : "text-amber-400"}`}>
                {formData.selfie || formData.ownerPhoto ? "✓ Captured" : "○ Pending"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">ID Front Side:</span>
              <span className={`font-bold ${formData.frontDoc ? "text-emerald-400" : "text-amber-400"}`}>
                {formData.frontDoc ? "✓ Captured" : "○ Pending"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">ID Back Side:</span>
              <span className={`font-bold ${formData.backDoc ? "text-emerald-400" : "text-amber-400"}`}>
                {formData.backDoc ? "✓ Captured" : "○ Optional"}
              </span>
            </div>
          </div>
        </div>

        {/* Hostel Details Card */}
        <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#202B45] pb-3">
            <Building2 size={16} /> Hostel & Facility Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block text-[11px]">Hostel Name</span>
              <span className="font-bold text-white text-sm">{formData.hostelName || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Category / Type</span>
              <span className="font-medium text-slate-200">{formData.hostelType || "PG"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Location</span>
              <span className="font-medium text-slate-200">{formData.city}, {formData.state} - {formData.pincode}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Rooms</span>
              <span className="font-bold text-white">{formData.roomsCount || 0} Rooms</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Capacity</span>
              <span className="font-bold text-white">{formData.capacity || 0} Beds</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Full Address</span>
              <span className="font-medium text-slate-300 truncate block">{formData.hostelAddress || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Documents Checklist */}
      <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#202B45] pb-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileCheck size={16} className="text-emerald-400" /> Document Checklist
          </span>
          <span className="text-[11px] text-slate-400">Uploaded Assets</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Owner Photo", present: !!(formData.ownerPhoto || formData.selfie) },
            { label: "Owner Selfie", present: !!formData.selfie },
            { label: "ID Front Side", present: !!formData.frontDoc },
            { label: "ID Back Side", present: !!formData.backDoc },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                item.present
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              <CheckCircle2 size={16} className={item.present ? "text-emerald-400" : "text-slate-600"} />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]"
        >
          {loading ? "Submitting Registration..." : "Submit Owner Registration"}
        </button>
      </div>
    </div>
  );
};

export default OwnerRegistrationReview;
