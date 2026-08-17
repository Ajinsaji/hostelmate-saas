import React, { useState } from "react";
import { Eye, ExternalLink, Download, FileText, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";

/**
 * Universal Document & Asset Preview Component
 * States: LOADING, AVAILABLE, MISSING, ERROR
 * Actions: [View], [Open], [Download]
 */
export default function DocumentPreviewCard({
  title = "Document",
  url = null,
  idNumber = null,
  onPreview = null,
  className = "",
  badge = null,
}) {
  const [imageState, setImageState] = useState(url ? "LOADING" : "MISSING");
  const isPdf = typeof url === "string" && (url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf"));
  const isValidUrl = Boolean(url && typeof url === "string" && !/^(default[_-]|placeholder|dummy|none|null|undefined)/i.test(url));

  const handleImageLoad = () => {
    setImageState("AVAILABLE");
  };

  const handleImageError = () => {
    setImageState("ERROR");
  };

  const handleOpenNewTab = (e) => {
    e.stopPropagation();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isValidUrl) {
    return (
      <div className={`p-4 rounded-xl bg-slate-900/60 border border-[#202B45] flex flex-col items-center justify-center text-center ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-500 flex items-center justify-center mb-2">
          <ImageIcon size={20} />
        </div>
        <span className="text-xs font-bold text-slate-300">{title}</span>
        <span className="text-[11px] text-slate-500 font-medium mt-0.5">Document not uploaded</span>
        {idNumber && <span className="text-[10px] text-slate-600 font-mono mt-1">ID: {idNumber}</span>}
      </div>
    );
  }

  return (
    <div
      onClick={onPreview || handleOpenNewTab}
      className={`p-3.5 rounded-xl bg-slate-900/80 border border-[#202B45] hover:border-emerald-500/50 transition flex flex-col justify-between group cursor-pointer shadow-md ${className}`}
    >
      <div>
        {/* Card Header with Title & Badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold text-white truncate">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {badge}
            </span>
          )}
        </div>

        {/* Thumbnail / PDF Preview Container */}
        <div className="w-full h-32 rounded-lg bg-black/40 border border-[#202B45] overflow-hidden relative flex items-center justify-center">
          {isPdf ? (
            <div className="flex flex-col items-center justify-center text-red-400 gap-1.5 p-2">
              <FileText size={32} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PDF Document</span>
            </div>
          ) : (
            <>
              {imageState === "LOADING" && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-10">
                  <Loader2 size={20} className="animate-spin text-emerald-400" />
                </div>
              )}
              {imageState === "ERROR" ? (
                <div className="flex flex-col items-center justify-center text-amber-400 gap-1 p-2">
                  <AlertCircle size={24} />
                  <span className="text-[10px] font-bold text-slate-400">Document unavailable</span>
                </div>
              ) : (
                <img
                  src={url}
                  alt={title}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${imageState === "LOADING" ? "opacity-0" : "opacity-100"}`}
                />
              )}
            </>
          )}
        </div>

        {idNumber && (
          <p className="text-[10px] text-slate-400 font-mono mt-2 truncate">Doc No: {idNumber}</p>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-[#202B45] mt-2.5">
        <button
          type="button"
          onClick={onPreview || handleOpenNewTab}
          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center justify-center gap-1 transition"
        >
          <Eye size={12} />
          <span>View</span>
        </button>

        <button
          type="button"
          onClick={handleOpenNewTab}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition"
          title="Open in new tab"
        >
          <ExternalLink size={13} />
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition"
          title="Download Document"
        >
          <Download size={13} />
        </button>
      </div>
    </div>
  );
}
