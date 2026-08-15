import React, { useState } from "react";
import { useParams } from "react-router-dom";
import ContentContainer from "../../layouts/ContentContainer";
import SectionHeader from "../../layouts/SectionHeader";
import StatCard from "../../components/cards/StatCard";
import SectionCard from "../../components/cards/SectionCard";
import QuickActionButton from "../../components/widgets/QuickActionButton";
import MetricRow from "../../components/widgets/MetricRow";
import useHostel from "../../hooks/useHostel";
import useHealthScore from "../../hooks/useHealthScore";
import { api } from "../../../services/api";
import toast from "react-hot-toast";
import { COLORS } from "../../constants/theme";
import { 
  ShieldAlert, 
  Sparkles, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckSquare, 
  Activity,
  QrCode,
  Copy,
  ExternalLink,
  Download,
  Check,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export const CustomerOverview = React.memo(() => {
  const { id } = useParams();
  const { data: hostel } = useHostel(id);
  const { data: health } = useHealthScore(id);

  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleAction = async (act) => {
    try {
      if (act === "call") {
        window.location.href = `tel:${hostel?.owner?.phone || hostel?.phone}`;
      } else if (act === "email") {
        window.location.href = `mailto:${hostel?.owner?.email || hostel?.email}`;
      } else if (act === "whatsapp") {
        window.open(`https://wa.me/${(hostel?.owner?.phone || hostel?.phone || '').replace('+', '')}`, '_blank');
      } else if (act === "impersonate") {
        const toastId = toast.loading("Initiating secure impersonation session...");
        const res = await api.post("/api/admin/impersonate", { ownerId: hostel?.owner?._id });
        if (res.data.success) {
          toast.success("Impersonation started", { id: toastId });
        } else {
          toast.error("Impersonation failed", { id: toastId });
        }
      } else if (act === "extend" || act === "suspend") {
        const toastId = toast.loading(`Executing ${act}...`);
        const res = await api.post("/api/admin/hostels/bulk-action", {
          action: act,
          hostelIds: [id]
        });
        if (res.data.success) {
          toast.success(`Action ${act} completed`, { id: toastId });
        } else {
          toast.error(`Action ${act} failed`, { id: toastId });
        }
      }
    } catch (e) {
      toast.error(`Error executing ${act}`);
    }
  };

  // Resolve Canonical Public Admission URL & QR
  const frontendBase = window.location.origin || "https://hostelmate-saas.vercel.app";
  const publicCode = hostel?.publicCode || hostel?.uniqueCode || hostel?.hostel?.publicCode || hostel?.hostel?.uniqueCode || "";
  const isDeleted = hostel?.isDeleted === true || hostel?.hostel?.isDeleted === true;
  const isPendingActivation = hostel?.pendingActivation === true || hostel?.hostel?.pendingActivation === true;
  const isPublicLinkAvailable = Boolean(publicCode) && !isPendingActivation && !isDeleted;
  
  const publicAdmissionUrl = isPublicLinkAvailable
    ? (hostel?.publicUrl || `${frontendBase}/h/${publicCode}`)
    : "";

  const qrImageSrc = isPublicLinkAvailable
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicAdmissionUrl)}&margin=8`
    : "";

  const handleCopyPublicUrl = () => {
    if (!publicAdmissionUrl) return;
    navigator.clipboard.writeText(publicAdmissionUrl);
    setCopiedUrl(true);
    toast.success("Public admission link copied to clipboard!");
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const handleDownloadQr = () => {
    if (!qrImageSrc) return;
    const link = document.createElement("a");
    link.href = qrImageSrc;
    link.download = `${hostel?.hostelName || hostel?.name || "hostel"}-admission-qr.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloading QR Code...");
  };

  return (
    <div className="space-y-6">
      {/* KPI metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Rooms" value={Array.isArray(hostel?.rooms) ? hostel.rooms.length : (hostel?.roomsCount || hostel?.rooms || "0")} trend="Active" trendDirection="neutral" />
        <StatCard title="Residents" value={Array.isArray(hostel?.residents) ? hostel.residents.length : (hostel?.residentsCount || hostel?.residents || "0")} trend="Occupied" trendDirection="neutral" />
        <StatCard title="Monthly Revenue" value={hostel?.revenue || "₹0"} trend="+6.2%" trendDirection="up" />
        <StatCard title="Health Rating" value={`${health?.score || 0}/100`} trend={health?.trend} trendDirection="up" />
      </div>

      {/* REAL PUBLIC ADMISSION & QR CODE SECTION */}
      <div className="bg-slate-900/60 border border-white/10 p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <QrCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Public Admission & QR Code</h3>
                {isPublicLinkAvailable ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 size={10} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    <AlertCircle size={10} /> Unavailable
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official resident registration & digital admission URL for prospective boarders
              </p>
            </div>
          </div>

          {isPublicLinkAvailable && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyPublicUrl}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition cursor-pointer min-h-[40px]"
              >
                {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedUrl ? "Copied!" : "Copy Link"}</span>
              </button>
              <a
                href={publicAdmissionUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition min-h-[40px]"
              >
                <ExternalLink size={14} />
                <span>Open Link</span>
              </a>
              <button
                onClick={handleDownloadQr}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer min-h-[40px] shadow-sm"
              >
                <Download size={14} />
                <span>Download QR</span>
              </button>
            </div>
          )}
        </div>

        {isPublicLinkAvailable ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Scannable Real QR Preview */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-white/20 shadow-md">
              <img
                src={qrImageSrc}
                alt="Public Admission QR"
                className="w-44 h-44 object-contain rounded-lg"
              />
              <span className="text-[11px] font-bold text-slate-800 mt-2 flex items-center gap-1">
                Scan with phone camera
              </span>
            </div>

            {/* URL Details */}
            <div className="md:col-span-2 space-y-3">
              <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Canonical Admission URL
                </span>
                <p className="text-xs font-mono text-emerald-400 break-all select-all font-semibold">
                  {publicAdmissionUrl}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Canonical Public Code</span>
                  <span className="text-white font-mono font-bold mt-0.5 block">{publicCode}</span>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Admission Route</span>
                  <span className="text-slate-300 font-mono text-[11px] mt-0.5 block">/h/{publicCode}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
            <AlertCircle size={24} className="mx-auto text-amber-400" />
            <h4 className="text-sm font-bold text-white">
              {isDeleted ? "Hostel is currently in 60-day Trash." : "Public admission link is not available yet."}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {isDeleted
                ? "Public admission is disabled while this hostel is in Trash. Restore the hostel to reactivate this admission link."
                : "This hostel has not completed registration activation or is currently pending setup. The public URL and scannable QR code will be generated once activation is complete."}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions panel */}
        <SectionCard title="Command Execution" subtitle="Platform actions for this customer">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <QuickActionButton label="Impersonate Owner" icon={<ShieldAlert size={14} />} variant="danger" onClick={() => handleAction("impersonate")} />
            <QuickActionButton label="WhatsApp Notice" icon={<MessageSquare size={14} />} variant="primary" onClick={() => handleAction("whatsapp")} />
            <QuickActionButton label="Call Owner" icon={<Phone size={14} />} variant="secondary" onClick={() => handleAction("call")} />
            <QuickActionButton label="Email Owner" icon={<Mail size={14} />} variant="secondary" onClick={() => handleAction("email")} />
            <QuickActionButton label="Extend Plan 30d" icon={<CheckSquare size={14} />} variant="success" onClick={() => handleAction("extend")} />
            <QuickActionButton label="Suspend Account" icon={<ShieldAlert size={14} />} variant="danger" onClick={() => handleAction("suspend")} />
          </div>
        </SectionCard>

        {/* Health score breakdown */}
        <SectionCard title="Business Health Score" subtitle="Platform engagement analytics" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs text-slate-400">Engagement Score</span>
              <span className="text-xl font-extrabold text-emerald-400">{health?.score}/100</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.isArray(health?.breakdown) &&
                health.breakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{item.factor}</span>
                      <span className="font-bold text-white">{item.points}/100</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${item.points}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Improvement Actions</p>
              {(() => {
                const suggestions = Array.isArray(health?.suggestions)
                  ? health.suggestions
                  : [];

                if (suggestions.length === 0) return null;

                return (
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                    {suggestions.map((s) => (
                      <li key={s.id ?? s.text}>{s.text}</li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
});

export default CustomerOverview;
