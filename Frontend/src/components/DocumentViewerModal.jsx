import React, { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink, Download, FileText, Image as ImageIcon, AlertCircle } from "lucide-react";
import buildFileUrl from "../utils/buildFileUrl";

export default function DocumentViewerModal({
  isOpen,
  onClose,
  documentUrl,
  title = "Document Preview",
}) {
  const [zoom, setZoom] = useState(1);
  const [imgLoadError, setImgLoadError] = useState(false);

  useEffect(() => {
    setZoom(1);
    setImgLoadError(false);
  }, [documentUrl, isOpen]);

  if (!isOpen || !documentUrl) return null;

  const resolvedUrl = buildFileUrl(documentUrl);

  // Strip query params & hash fragment for extension detection
  const cleanUrl = String(documentUrl).split("?")[0].split("#")[0].toLowerCase();

  const isPdf = cleanUrl.endsWith(".pdf") || cleanUrl.includes("application/pdf");
  const isImage =
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".webp") ||
    cleanUrl.endsWith(".gif") ||
    cleanUrl.endsWith(".bmp") ||
    cleanUrl.endsWith(".svg") ||
    cleanUrl.includes("image/");

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-[#0B1120] border border-[#202B45] rounded-2xl shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#202B45] bg-[#11192A] shrink-0">
          <div className="flex items-center gap-2.5 truncate pr-2">
            {isPdf ? (
              <FileText className="h-5 w-5 text-red-400 shrink-0" />
            ) : isImage ? (
              <ImageIcon className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-blue-400 shrink-0" />
            )}
            <h3 className="font-bold text-sm sm:text-base text-slate-100 truncate">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isImage && !imgLoadError && (
              <div className="hidden sm:flex items-center gap-1 bg-[#1A2438] px-2 py-1 rounded-lg border border-[#202B45] mr-2">
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1 hover:bg-[#25334E] rounded text-slate-300 transition"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono px-1.5 text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1 hover:bg-[#25334E] rounded text-slate-300 transition"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="p-1 hover:bg-[#25334E] rounded text-slate-300 transition"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}

            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="p-2 bg-[#1A2438] hover:bg-[#25334E] rounded-xl border border-[#202B45] text-slate-300 transition"
            >
              <ExternalLink size={16} />
            </a>

            <a
              href={resolvedUrl}
              download
              title="Download file"
              className="p-2 bg-[#1A2438] hover:bg-[#25334E] rounded-xl border border-[#202B45] text-slate-300 transition"
            >
              <Download size={16} />
            </a>

            <button
              onClick={onClose}
              className="p-2 bg-[#1A2438] hover:bg-red-500/20 hover:text-red-400 rounded-xl border border-[#202B45] text-slate-400 transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="relative flex-1 bg-[#070B14] p-2 sm:p-4 overflow-auto flex items-center justify-center min-h-[300px]">
          {isImage ? (
            imgLoadError ? (
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-400">
                  <AlertCircle size={40} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-base">Document could not be loaded.</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    The requested image document could not be retrieved from the server. Please verify your connection or open the file directly in a new tab.
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <ExternalLink size={14} /> Open Document in New Tab
                  </a>
                  <a
                    href={resolvedUrl}
                    download
                    className="px-5 py-2.5 bg-[#1A2438] hover:bg-[#25334E] border border-[#202B45] text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <Download size={14} /> Download File
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                <img
                  src={resolvedUrl}
                  alt={title}
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                  className="max-w-full max-h-[70vh] object-contain transition-transform duration-200 rounded-lg shadow-lg"
                  onError={() => {
                    setImgLoadError(true);
                  }}
                />
              </div>
            )
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col items-center min-h-[500px]">
              <iframe
                src={resolvedUrl}
                title={title}
                className="w-full h-[65vh] rounded-xl border border-[#202B45] bg-white"
              />
              <div className="mt-3 flex items-center justify-between w-full text-xs text-slate-400">
                <span>PDF Document Loaded</span>
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink size={12} /> Open PDF Fullscreen
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="p-4 bg-[#1A2438] rounded-full border border-[#202B45] text-emerald-400">
                <FileText size={40} />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-base">Preview unavailable for this file type.</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  This document format does not support inline browser previewing. You can open or download the file below.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                >
                  <ExternalLink size={14} /> Open Document in New Tab
                </a>
                <a
                  href={resolvedUrl}
                  download
                  className="px-5 py-2.5 bg-[#1A2438] hover:bg-[#25334E] border border-[#202B45] text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                >
                  <Download size={14} /> Download File
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
