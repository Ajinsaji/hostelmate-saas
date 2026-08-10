import React, { useState } from "react";
import { 
  X, ArrowLeft, Building2, User, FileText, CheckCircle2, ShieldAlert, UserCheck,
  MapPin, Phone, Mail, Hash, Calendar, ShieldCheck, Eye, Download, Image as ImageIcon,
  ExternalLink, Layers, Award, Clock, Zap
} from "lucide-react";
import ConfirmActionModal from "../modals/ConfirmActionModal";

export const RegistrationDetailsDrawer = React.memo(({
  isOpen,
  onClose,
  requestData,
  onActionComplete
}) => {
  const [modalAction, setModalAction] = useState(null); // "approve" | "reject" | "assign"
  const [previewDoc, setPreviewDoc] = useState(null); // { url, title }

  if (!isOpen || !requestData) return null;

  // Mask sensitive ID helper (e.g. 123456789012 -> ****9012)
  const maskDocNumber = (val) => {
    if (!val) return "****1234";
    const str = String(val);
    if (str.length <= 4) return "****";
    return `****${str.slice(-4)}`;
  };

  // Helper to format values or return fallback
  const displayVal = (val, fallback = "Not provided") => {
    if (val === null || val === undefined || val === "") return fallback;
    return val;
  };

  // Status Badge Component
  const renderStatusBadge = (statusStr) => {
    const status = String(statusStr || "pending").toLowerCase();
    switch (status) {
      case "activated":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} /> Activated / Approved
          </span>
        );
      case "activation_pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Clock size={12} /> Activation Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-bold uppercase tracking-wider">
            <ShieldAlert size={12} /> Rejected
          </span>
        );
      case "assigned":
      case "under review":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <UserCheck size={12} /> Under Review
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-bold uppercase tracking-wider">
            <Clock size={12} /> Action Required • Pending
          </span>
        );
    }
  };

  const isPdf = (url) => typeof url === "string" && url.toLowerCase().includes(".pdf");

  return (
    <>
      <div className="fixed inset-0 z-[5000] flex justify-end">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Responsive Panel: Full-screen on mobile (<768px), right-drawer on desktop (>=768px) */}
        <div className="relative w-full md:max-w-2xl h-full bg-[#0B1220] border-l border-[#202B45] flex flex-col shadow-2xl z-10 overflow-hidden text-white">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#202B45] bg-[#131C2E] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Back Arrow for Mobile */}
              <button 
                onClick={onClose}
                className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide">Hostel Registration</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                    ID: {requestData._id || requestData.id || "N/A"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Submitted: {new Date(requestData.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

            {/* Profile Overview Card */}
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {requestData.ownerPhoto ? (
                    <img 
                      src={requestData.ownerPhoto} 
                      alt={requestData.ownerName}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#202B45] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold shrink-0">
                      {(requestData.ownerName || "O").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-white">{displayVal(requestData.hostelName, "Unnamed Hostel")}</h3>
                    <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <User size={13} className="text-emerald-400" />
                      {displayVal(requestData.ownerName, "Unknown Owner")}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin size={13} className="text-slate-400" />
                      {displayVal(requestData.city)}, {displayVal(requestData.state)}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 sm:text-right flex flex-col items-start sm:items-end gap-1.5">
                  {renderStatusBadge(requestData.status)}
                  {(requestData.assignedTeam || requestData.assignedTo) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                      <UserCheck size={10} /> Assigned to: {requestData.assignedTeam || requestData.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 1 — Owner Information */}
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#202B45] pb-3">
                <User size={16} className="text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Section 1 — Owner Profile</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Full Name</span>
                  <p className="text-white font-semibold">{displayVal(requestData.ownerName)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Phone Number</span>
                  <p className="text-white font-semibold flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-400" />
                    {displayVal(requestData.phone)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Email Address</span>
                  <p className="text-white font-semibold flex items-center gap-1.5 truncate">
                    <Mail size={12} className="text-slate-400" />
                    {displayVal(requestData.email)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-medium block mb-1">Owner Address</span>
                  <p className="text-white font-semibold">{displayVal(requestData.ownerAddress)}</p>
                </div>
              </div>
            </div>

            {/* SECTION 2 — Identity Documents */}
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#202B45] pb-3">
                <ShieldCheck size={16} className="text-blue-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Section 2 — Identity Documents</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0B1220]/60 border border-[#202B45] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Identity Proof</span>
                    <p className="text-xs font-bold text-white mt-1">Aadhaar Card / Govt ID</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Doc No: {maskDocNumber(requestData.phone)}</p>
                  </div>
                  {requestData.aadhaarFile ? (
                    <button
                      onClick={() => setPreviewDoc({ url: requestData.aadhaarFile, title: "Aadhaar Card" })}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Eye size={12} /> View
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">Not provided</span>
                  )}
                </div>

                <div className="p-4 bg-[#0B1220]/60 border border-[#202B45] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Owner Photograph</span>
                    <p className="text-xs font-bold text-white mt-1">Profile Photo</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Passport Size Image</p>
                  </div>
                  {requestData.ownerPhoto ? (
                    <button
                      onClick={() => setPreviewDoc({ url: requestData.ownerPhoto, title: "Owner Photo" })}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Eye size={12} /> View
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3 — Hostel Information */}
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#202B45] pb-3">
                <Building2 size={16} className="text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Section 3 — Hostel Specifications</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Hostel Name</span>
                  <p className="text-white font-semibold">{displayVal(requestData.hostelName)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Hostel Type</span>
                  <p className="text-white font-semibold uppercase">{displayVal(requestData.hostelType, "Co-ed Hostel")}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">City / Town</span>
                  <p className="text-white font-semibold">{displayVal(requestData.city)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">District</span>
                  <p className="text-white font-semibold">{displayVal(requestData.district)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">State</span>
                  <p className="text-white font-semibold">{displayVal(requestData.state)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Pincode</span>
                  <p className="text-white font-semibold">{displayVal(requestData.pincode)}</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="text-slate-400 font-medium block mb-1">Full Address</span>
                  <p className="text-white font-semibold">{displayVal(requestData.hostelAddress)}</p>
                </div>
              </div>
            </div>

            {/* SECTION 4 — Business & License Info */}
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#202B45] pb-3">
                <Award size={16} className="text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Section 4 — Business & License Info</h4>
              </div>

              <div className="p-4 bg-[#0B1220]/60 border border-[#202B45] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hostel Operating License</span>
                  <p className="text-xs font-bold text-white mt-1">Trade / Municipal License</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Verification status: Pending Review</p>
                </div>
                {requestData.licensePhoto ? (
                  <button
                    onClick={() => setPreviewDoc({ url: requestData.licensePhoto, title: "License Certificate" })}
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    <Eye size={12} /> View Document
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500">Not provided</span>
                )}
              </div>
            </div>

            {/* ASSIGNMENT SECTION */}
            {(requestData.assignedTeam || requestData.assignedTo) && (
              <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#202B45] pb-3">
                  <UserCheck size={16} className="text-blue-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Assignment Details</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Assigned Team</span>
                    <p className="text-white font-semibold flex items-center gap-1.5">
                      <UserCheck size={12} className="text-blue-400" />
                      {displayVal(requestData.assignedTeam, "Verification Team")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Assigned Admin</span>
                    <p className="text-white font-semibold">
                      {typeof requestData.assignedTo === 'object' && requestData.assignedTo !== null
                        ? (requestData.assignedTo.fullName || requestData.assignedTo.name || requestData.assignedTo.email || "Internal Admin")
                        : displayVal(requestData.assignedTo, "Internal Admin")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Assigned By</span>
                    <p className="text-white font-semibold">{displayVal(requestData.assignedBy, "Super Admin")}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Assigned At</span>
                    <p className="text-white font-semibold">
                      {requestData.assignedAt
                        ? new Date(requestData.assignedAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5 — Uploaded Documents Gallery */}
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#202B45] pb-3">
                <FileText size={16} className="text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Section 5 — Document Gallery</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <DocGalleryItem 
                  title="Owner Photo" 
                  url={requestData.ownerPhoto} 
                  onPreview={() => setPreviewDoc({ url: requestData.ownerPhoto, title: "Owner Photo" })}
                />
                <DocGalleryItem 
                  title="Aadhaar / ID Proof" 
                  url={requestData.aadhaarFile} 
                  onPreview={() => setPreviewDoc({ url: requestData.aadhaarFile, title: "Aadhaar / ID Proof" })}
                />
                <DocGalleryItem 
                  title="License Photo" 
                  url={requestData.licensePhoto} 
                  onPreview={() => setPreviewDoc({ url: requestData.licensePhoto, title: "Hostel License" })}
                />
              </div>
            </div>

            {/* Rejection Reason display if rejected */}
            {requestData.rejectionReason && (
              <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-2xl text-xs text-[#EF4444]">
                <p className="font-bold uppercase tracking-wider text-[10px] mb-1">Rejection Reason</p>
                <p className="font-medium text-red-200">{requestData.rejectionReason}</p>
              </div>
            )}

            {/* Audit Timeline */}
            {requestData.timeline && requestData.timeline.length > 0 && (
              <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#202B45] pb-2">Audit History</h4>
                <div className="space-y-2">
                  {requestData.timeline.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-300">
                      <span>• {item.action} by <strong className="text-white">{item.by || 'Admin'}</strong></span>
                      <span className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-5 bg-[#131C2E] border-t border-[#202B45] flex flex-col sm:flex-row gap-2.5 shrink-0 shadow-2xl">
            {requestData.status === "activation_pending" ? (
              <button
                onClick={() => setModalAction("activate")}
                className="flex-1 min-h-[48px] py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
              >
                <Zap size={16} />
                Finalize Activation & Subscription
              </button>
            ) : (
              <button
                onClick={() => setModalAction("approve")}
                disabled={requestData.status === "activated" || requestData.status === "approved"}
                className="flex-1 min-h-[48px] py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                <CheckCircle2 size={16} />
                {requestData.status === "activated" || requestData.status === "approved" ? "Activated" : "Approve Request"}
              </button>
            )}

            <button
              onClick={() => setModalAction("reject")}
              disabled={requestData.status === "rejected"}
              className="flex-1 min-h-[48px] py-3 px-4 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 disabled:opacity-40 text-[#EF4444] border border-[#EF4444]/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <ShieldAlert size={16} />
              Reject Request
            </button>

            <button
              onClick={() => setModalAction("assign")}
              className="flex-1 sm:flex-none min-h-[48px] py-3 px-4 bg-[#0B1220] hover:bg-white/5 text-slate-300 border border-[#202B45] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <UserCheck size={16} />
              Assign to Team
            </button>
          </div>

        </div>
      </div>

      {/* Action Confirmation Modal */}
      <ConfirmActionModal
        isOpen={!!modalAction}
        onClose={() => setModalAction(null)}
        actionType={modalAction}
        requestData={requestData}
        onSuccess={(type, msg) => {
          onActionComplete && onActionComplete(type, msg);
          onClose();
        }}
      />

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPreviewDoc(null)} />
          <div className="relative w-full max-w-3xl bg-[#131C2E] border border-[#202B45] rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#202B45]">
              <h3 className="text-sm font-bold text-white">{previewDoc.title}</h3>
              <div className="flex items-center gap-2">
                <a 
                  href={previewDoc.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition text-xs flex items-center gap-1"
                >
                  <ExternalLink size={14} /> Open Original
                </a>
                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-[#0B1220]">
              {isPdf(previewDoc.url) ? (
                <iframe 
                  src={previewDoc.url} 
                  title={previewDoc.title} 
                  className="w-full h-[600px] rounded-xl border border-[#202B45]" 
                />
              ) : (
                <img 
                  src={previewDoc.url} 
                  alt={previewDoc.title} 
                  className="max-w-full max-h-[70vh] object-contain rounded-xl" 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

function DocGalleryItem({ title, url, onPreview }) {
  if (!url) {
    return (
      <div className="p-3 bg-[#0B1220]/60 border border-[#202B45] rounded-xl flex flex-col items-center justify-center text-center opacity-60">
        <ImageIcon size={20} className="text-slate-500 mb-1" />
        <span className="text-[10px] font-bold text-slate-400">{title}</span>
        <span className="text-[9px] text-slate-500 mt-0.5">Not provided</span>
      </div>
    );
  }

  const isPdfFile = typeof url === "string" && url.toLowerCase().includes(".pdf");

  return (
    <div 
      onClick={onPreview}
      className="p-3 bg-[#0B1220]/80 border border-[#202B45] hover:border-emerald-500/50 rounded-xl flex flex-col items-center text-center cursor-pointer transition group"
    >
      {isPdfFile ? (
        <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
          <FileText size={20} />
        </div>
      ) : (
        <img 
          src={url} 
          alt={title} 
          className="w-12 h-12 object-cover rounded-lg mb-2 border border-[#202B45] group-hover:scale-105 transition" 
        />
      )}
      <span className="text-[10px] font-bold text-white truncate max-w-full">{title}</span>
      <span className="text-[9px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-0.5">
        <Eye size={10} /> View Document
      </span>
    </div>
  );
}

export default RegistrationDetailsDrawer;
