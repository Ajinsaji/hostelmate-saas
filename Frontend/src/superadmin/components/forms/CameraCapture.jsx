import React, { useEffect } from "react";
import { Camera, RefreshCw, X, Check, Upload, AlertCircle, Image as ImageIcon } from "lucide-react";
import useCameraCapture from "../../hooks/useCameraCapture";
import { compressImage } from "../../../utils/imageCompressor";

export const CameraCapture = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Camera Capture",
  defaultFacingMode = "user", // 'user' for selfie, 'environment' for document ID
  isDocument = false,
}) => {
  const {
    isActive,
    facingMode,
    capturedImage,
    hasCamera,
    permissionDenied,
    error,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
    retake,
    setCapturedImage,
  } = useCameraCapture({ defaultFacingMode });

  useEffect(() => {
    if (isOpen) {
      startCamera(defaultFacingMode);
    } else {
      stopCamera();
    }
  }, [isOpen, defaultFacingMode, startCamera, stopCamera]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const result = evt.target?.result;
        if (result) {
          const compressed = await compressImage(result, 1200, 0.8);
          setCapturedImage(compressed || result);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onConfirm(capturedImage);
      stopCamera();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#131C2E] border border-[#202B45] rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202B45] bg-[#0B1220]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">
                {facingMode === "user" ? "Front Camera (Selfie)" : "Back Camera (Document Capture)"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Preview / Captured Display */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-2">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-h-[380px] w-auto object-contain rounded-xl border border-white/10"
              />
            </div>
          ) : isActive ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full max-h-[400px] object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Document Guide Overlay */}
              {isDocument && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="w-full max-w-[340px] h-[210px] border-2 border-dashed border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    <p className="text-xs font-bold text-emerald-400 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      PLACE DOCUMENT INSIDE FRAME
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center space-y-4 max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {permissionDenied ? "Camera access was not granted." : error || "Camera stream unavailable."}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition min-h-[44px]"
                >
                  Try Again
                </button>
                <label className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/20 transition min-h-[44px] flex items-center gap-1.5">
                  <Upload size={14} /> Upload Photo Instead
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 border-t border-[#202B45] bg-[#0B1220]/60 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                onClick={retake}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2 min-h-[48px]"
              >
                <RefreshCw size={16} /> Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Check size={16} /> Confirm & Use Photo
              </button>
            </>
          ) : isActive ? (
            <>
              <button
                onClick={switchCamera}
                className="py-3 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2 min-h-[48px]"
                title="Switch Camera"
              >
                <RefreshCw size={16} /> Switch Camera
              </button>

              <button
                onClick={captureFrame}
                className="flex-1 py-3 px-6 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Camera size={18} /> Capture Photo
              </button>

              <label className="p-3 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center">
                <ImageIcon size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <div className="w-full flex justify-between items-center">
              <button
                onClick={() => startCamera(facingMode)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
