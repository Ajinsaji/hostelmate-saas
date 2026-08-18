import React, { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, Check, Eye, Trash2, Shield, FileText } from "lucide-react";
import CameraCapture from "./CameraCapture";

export const DocumentCapture = ({
  idType,
  setIdType,
  idNumber,
  setIdNumber,
  frontDoc,
  setFrontDoc,
  backDoc,
  setBackDoc,
}) => {
  const [activeCaptureSide, setActiveCaptureSide] = useState(null); // 'front' or 'back'

  const handleFileUpload = (side, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result;
        if (result) {
          if (side === "front") setFrontDoc(result);
          if (side === "back") setBackDoc(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getDocMaskPlaceholder = () => {
    switch (idType) {
      case "Aadhaar":
        return "XXXX XXXX 1234 (12 digits)";
      case "Passport":
        return "A1234567 (8 chars)";
      case "Driving Licence":
        return "DL-1420110012345";
      default:
        return "Document ID Number";
    }
  };

  const requiresBackSide = idType === "Aadhaar" || idType === "Driving Licence";

  return (
    <div className="space-y-6">
      {/* Document Type Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Identity Document Type <span className="text-[#EF4444]">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {["Aadhaar", "Passport", "Driving Licence"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setIdType(type)}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] ${
                idType === type
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10"
                  : "bg-[#0B1220] border-[#202B45] text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText size={16} />
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Document Number Input */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          {idType} Document Number <span className="text-[#EF4444]">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder={getDocMaskPlaceholder()}
            className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-mono tracking-wider">
            SECURE KYC
          </div>
        </div>
      </div>

      {/* Front and Back Document Capture Cards */}
      <div className={`grid grid-cols-1 ${requiresBackSide ? "md:grid-cols-2" : ""} gap-4`}>
        {/* Front Side */}
        <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              {idType} Front Side <span className="text-[#EF4444]">*</span>
            </span>
            {frontDoc && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Check size={12} className="stroke-[3]" /> Captured
              </span>
            )}
          </div>

          {frontDoc ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10 group bg-slate-950 h-40 flex items-center justify-center">
              <img src={frontDoc} alt="Document Front" className="h-full w-auto object-contain" />
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCaptureSide("front")}
                  className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
                  title="Retake Photo"
                >
                  <Camera size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setFrontDoc(null)}
                  className="p-2.5 bg-[#EF4444] text-white rounded-xl hover:bg-red-600 transition"
                  title="Delete Document"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#202B45] hover:border-emerald-500/40 rounded-xl p-6 text-center space-y-3 bg-white/[0.01] transition">
              <p className="text-xs text-slate-400">Capture or upload document front side</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCaptureSide("front")}
                  className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
                >
                  <Camera size={16} /> 📷 Capture Front
                </button>
                <label className="px-3.5 py-2 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[44px]">
                  <Upload size={16} /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload("front", e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Back Side (if required) */}
        {requiresBackSide && (
          <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                {idType} Back Side <span className="text-[#EF4444]">*</span>
              </span>
              {backDoc && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Check size={12} className="stroke-[3]" /> Captured
                </span>
              )}
            </div>

            {backDoc ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 group bg-slate-950 h-40 flex items-center justify-center">
                <img src={backDoc} alt="Document Back" className="h-full w-auto object-contain" />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCaptureSide("back")}
                    className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
                    title="Retake Photo"
                  >
                    <Camera size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackDoc(null)}
                    className="p-2.5 bg-[#EF4444] text-white rounded-xl hover:bg-red-600 transition"
                    title="Delete Document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#202B45] hover:border-emerald-500/40 rounded-xl p-6 text-center space-y-3 bg-white/[0.01] transition">
                <p className="text-xs text-slate-400">Capture or upload document back side</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCaptureSide("back")}
                    className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
                  >
                    <Camera size={16} /> 📷 Capture Back
                  </button>
                  <label className="px-3.5 py-2 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[44px]">
                    <Upload size={16} /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("back", e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Capture Modal Instance */}
      <CameraCapture
        isOpen={!!activeCaptureSide}
        onClose={() => setActiveCaptureSide(null)}
        title={`Capture ${idType} ${activeCaptureSide === "front" ? "Front Side" : "Back Side"}`}
        defaultFacingMode="environment"
        isDocument={true}
        onConfirm={(imageData) => {
          if (activeCaptureSide === "front") setFrontDoc(imageData);
          if (activeCaptureSide === "back") setBackDoc(imageData);
          setActiveCaptureSide(null);
        }}
      />
    </div>
  );
};

export default DocumentCapture;
