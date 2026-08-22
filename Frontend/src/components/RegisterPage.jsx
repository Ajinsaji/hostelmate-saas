import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Shield,
  User,
  FileCheck,
  CheckCircle2,
  Check,
  Camera,
  Upload,
  AlertTriangle,
  MapPin,
  Sparkles,
  Search,
  Loader2,
  Lock,
  FileText,
  Clock,
  Eye,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import useOwnerCreation from "../superadmin/hooks/useOwnerCreation";
import DocumentCapture from "../superadmin/components/forms/DocumentCapture";
import CameraCapture from "../superadmin/components/forms/CameraCapture";
import toast from "react-hot-toast";

const STEPS = [
  { num: "01", label: "Owner", fullLabel: "Owner Information", icon: User },
  { num: "02", label: "KYC", fullLabel: "Identity & KYC", icon: Shield },
  { num: "03", label: "Hostel", fullLabel: "Hostel Details", icon: Building2 },
  { num: "04", label: "Documents", fullLabel: "Document Checklist", icon: FileCheck },
  { num: "05", label: "Review", fullLabel: "Review & Submit", icon: CheckCircle2 },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const {
    step,
    setStep,
    formData,
    updateFormData,
    handlePincodeChange,
    pincodeLoading,
    pincodeStatus,
    nextStep,
    prevStep,
    submitRegistration,
    loading,
    error,
    submittedResult,
  } = useOwnerCreation("public");

  const [isSelfieCameraOpen, setIsSelfieCameraOpen] = useState(false);
  const [isLicenseCameraOpen, setIsLicenseCameraOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const onPincodeInput = (e, target = "hostel") => {
    const val = e.target.value;
    if (handlePincodeChange) {
      handlePincodeChange(val, target);
    } else {
      handleChange(e);
    }
  };

  const maskDocNumber = (num = "") => {
    if (!num) return "Not Specified";
    const cleaned = String(num).replace(/\s+/g, "");
    if (cleaned.length >= 8) {
      return `XXXX XXXX ${cleaned.slice(-4)}`;
    }
    return `XXXX ${cleaned.slice(-3)}`;
  };

  // Motion Variants
  const stepVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20, transition: { duration: 0.15 } },
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col lg:flex-row relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full filter blur-[140px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* LEFT SIDE: BRANDING PANEL (30–35% Width on Desktop) */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-[34%] bg-[#131C2E]/95 border-b lg:border-b-0 lg:border-r border-[#202B45] p-6 lg:p-10 flex flex-col justify-between relative z-10 lg:min-h-screen">
        <div className="space-y-8">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              HM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg tracking-tight">HostelMate</span>
                <span className="text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SAAS
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium block">Smart Hostel Management Platform</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Enterprise Property Onboarding</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Build and manage your hostel with confidence.
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              Register your property on HostelMate. Our streamlined onboarding securely verifies owner KYC, room capacity, and licensing before account activation.
            </p>
          </div>

          {/* Feature Highlight Cards */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#0B1220]/80 border border-[#202B45] flex items-center gap-3.5 shadow-sm hover:border-emerald-500/30 transition">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Building2 size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Multi-Room & Bed Inventory</span>
                <span className="text-[11px] text-slate-400 truncate block">Real-time room occupancy & tenant check-ins</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0B1220]/80 border border-[#202B45] flex items-center gap-3.5 shadow-sm hover:border-emerald-500/30 transition">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Smartphone size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Automated WhatsApp Receipts</span>
                <span className="text-[11px] text-slate-400 truncate block">One-click rent reminders & digital payment receipts</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0B1220]/80 border border-[#202B45] flex items-center gap-3.5 shadow-sm hover:border-emerald-500/30 transition">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Shield size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Digital KYC & Verification</span>
                <span className="text-[11px] text-slate-400 truncate block">Secure Aadhaar verification & encrypted documents</span>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="pt-2 border-t border-[#202B45] grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
            <div className="flex flex-col items-center gap-1">
              <Lock size={14} className="text-emerald-400" />
              <span className="font-semibold text-slate-300">256-bit Secure</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Shield size={14} className="text-emerald-400" />
              <span className="font-semibold text-slate-300">Verified Owner</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <FileCheck size={14} className="text-emerald-400" />
              <span className="font-semibold text-slate-300">KYC Protected</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 mt-6 border-t border-[#202B45] text-xs text-slate-500 flex items-center justify-between">
          <span>HostelMate OS v3.2</span>
          <span>© {new Date().getFullYear()} BetaMind Tech</span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* RIGHT SIDE: REGISTRATION FORM WORKSPACE (65–70% Width) */}
      {/* ========================================================================= */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 flex flex-col justify-between relative z-10 overflow-y-auto max-w-5xl">
        <div className="space-y-6">
          {/* Top Bar: Back & Heading */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#131C2E] border border-[#202B45] hover:border-emerald-500/30 px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>

            {step < 5 && (
              <div className="flex items-center gap-2 bg-[#131C2E] border border-[#202B45] px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-400 shadow-sm">
                <Sparkles size={13} className="animate-pulse" />
                <span>STEP {step + 1} OF 5</span>
              </div>
            )}
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Create your HostelMate account
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Complete your registration in a few simple steps.
            </p>
          </div>

          {/* Desktop Horizontal Step Progress Tracker */}
          {step < 5 && (
            <div className="hidden sm:flex bg-[#131C2E]/90 backdrop-blur-xl border border-[#202B45] rounded-2xl p-4 items-center justify-between shadow-xl">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = idx < step;
                const isCurrent = idx === step;

                return (
                  <div key={idx} className="flex items-center flex-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                          isCompleted
                            ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                            : isCurrent
                            ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10"
                            : "bg-[#0B1220] border border-[#202B45] text-slate-500"
                        }`}
                      >
                        {isCompleted ? <Check size={16} className="stroke-[3]" /> : <span className="font-mono text-xs">{s.num}</span>}
                      </div>
                      <div className="hidden md:block">
                        <span className={`block text-xs font-bold transition-colors ${isCurrent ? "text-white" : isCompleted ? "text-slate-300" : "text-slate-500"}`}>
                          {s.label}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">{s.fullLabel}</span>
                      </div>
                    </div>
                    {idx !== STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${idx < step ? "bg-emerald-500/50" : "bg-[#202B45]"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mobile Compact Progress Bar */}
          {step < 5 && (
            <div className="sm:hidden bg-[#131C2E] border border-[#202B45] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-400 uppercase tracking-wider">STEP {step + 1} OF 5</span>
                <span className="text-white">{STEPS[step]?.fullLabel}</span>
              </div>
              <div className="w-full bg-[#0B1220] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${((step + 1) / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP FORM CONTAINER */}
          {/* ========================================================================= */}
          <div className="bg-[#131C2E]/90 backdrop-blur-xl border border-[#202B45] rounded-3xl p-6 sm:p-8 shadow-2xl relative min-h-[460px]">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs font-medium flex items-center gap-3 shadow-lg">
                <AlertTriangle size={18} className="text-[#EF4444] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ========================================================================= */}
              {/* STEP 01 — OWNER INFORMATION */}
              {/* ========================================================================= */}
              {step === 0 && (
                <motion.div key="step-0" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                  <div className="border-b border-[#202B45] pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <User size={18} className="text-emerald-400" /> Step 1: Personal & Contact Information
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the primary hostel owner's details. These credentials will be used for owner portal access and WhatsApp communication.
                    </p>
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Personal Details</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Full Name <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          name="ownerName"
                          value={formData.ownerName}
                          onChange={handleChange}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Primary Mobile (WhatsApp Login) <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. 9876543210"
                          maxLength={10}
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Alternate Phone <span className="text-slate-500 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          name="altPhone"
                          value={formData.altPhone}
                          onChange={handleChange}
                          placeholder="e.g. 9123456780"
                          maxLength={10}
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Email Address <span className="text-slate-500 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="e.g. owner@example.com"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Owner Photo Capture */}
                  <div className="p-4 rounded-2xl bg-[#0B1220]/80 border border-[#202B45] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">Owner Profile Photo / Selfie</span>
                        <span className="text-[11px] text-slate-400">Capture with camera or upload a clear passport photo.</span>
                      </div>
                      {(formData.ownerPhoto || formData.selfie) && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                          <Check size={12} /> Uploaded
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsSelfieCameraOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                      >
                        <Camera size={15} /> Use Camera
                      </button>

                      <label className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/10">
                        <Upload size={15} /> Choose Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => updateFormData({ ownerPhoto: reader.result });
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {(formData.ownerPhoto || formData.selfie) && (
                        <button
                          type="button"
                          onClick={() => updateFormData({ ownerPhoto: null, selfie: null })}
                          className="px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-red-500/20"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permanent Address */}
                  <div className="space-y-4 pt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Permanent Residence Address</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Street Address
                        </label>
                        <input
                          name="ownerAddress"
                          value={formData.ownerAddress}
                          onChange={handleChange}
                          placeholder="House / Flat No., Street, Landmark"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Pincode</span>
                          {pincodeLoading && <span className="text-emerald-400 text-[10px] font-normal flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Looking up...</span>}
                        </label>
                        <input
                          name="ownerPincode"
                          value={formData.ownerPincode}
                          onChange={(e) => onPincodeInput(e, "owner")}
                          placeholder="e.g. 110001"
                          maxLength={6}
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">City</label>
                        <input
                          name="ownerCity"
                          value={formData.ownerCity}
                          onChange={handleChange}
                          placeholder="e.g. New Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">District</label>
                        <input
                          name="ownerDistrict"
                          value={formData.ownerDistrict}
                          onChange={handleChange}
                          placeholder="e.g. Central Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">State</label>
                        <input
                          name="ownerState"
                          value={formData.ownerState}
                          onChange={handleChange}
                          placeholder="e.g. Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* STEP 02 — KYC VERIFICATION */}
              {/* ========================================================================= */}
              {step === 1 && (
                <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                  <div className="border-b border-[#202B45] pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Shield size={18} className="text-emerald-400" /> Step 2: Identity & KYC Verification
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your Government ID details. Upload clear front and back photos for identity verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Document Type <span className="text-[#EF4444]">*</span>
                      </label>
                      <select
                        name="idType"
                        value={formData.idType}
                        onChange={handleChange}
                        className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="Aadhaar">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Voter ID">Voter ID</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {formData.idType === "Aadhaar" ? "12-Digit Aadhaar Number" : "Document ID Number"}{" "}
                        <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleChange}
                        maxLength={formData.idType === "Aadhaar" ? 12 : 20}
                        placeholder={formData.idType === "Aadhaar" ? "e.g. 123456789012" : "e.g. A1234567"}
                        className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20 font-mono"
                      />
                      <span className="text-[11px] text-slate-400 block">
                        {formData.idType === "Aadhaar" ? "Enter exactly 12 digits without spaces." : "Enter your official ID number."}
                      </span>
                    </div>
                  </div>

                  {/* Document Capture Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <DocumentCapture
                      title="Aadhaar Front Side"
                      subtitle="Upload or capture the front side containing photo and name"
                      document={formData.frontDoc}
                      onCapture={(doc) => updateFormData({ frontDoc: doc })}
                      onRemove={() => updateFormData({ frontDoc: null })}
                      required={true}
                    />

                    <DocumentCapture
                      title="Aadhaar Back Side"
                      subtitle="Upload or capture the back side containing address"
                      document={formData.backDoc}
                      onCapture={(doc) => updateFormData({ backDoc: doc })}
                      onRemove={() => updateFormData({ backDoc: null })}
                      required={formData.idType === "Aadhaar"}
                    />
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* STEP 03 — HOSTEL DETAILS */}
              {/* ========================================================================= */}
              {step === 2 && (
                <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                  <div className="border-b border-[#202B45] pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Building2 size={18} className="text-emerald-400" /> Step 3: Hostel Details & Capacity
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure your property name, location, and total room/bed capacity.
                    </p>
                  </div>

                  {/* Property Basics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Hostel / PG Name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        name="hostelName"
                        value={formData.hostelName}
                        onChange={handleChange}
                        placeholder="e.g. Royal Living Hostel"
                        className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Hostel Category / Type <span className="text-[#EF4444]">*</span>
                      </label>
                      <select
                        name="hostelType"
                        value={formData.hostelType}
                        onChange={handleChange}
                        className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="Boys Hostel">Boys Hostel</option>
                        <option value="Girls Hostel">Girls Hostel</option>
                        <option value="Co-Living PG">Co-Living PG</option>
                        <option value="Working Professionals">Working Professionals</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Total Rooms <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="number"
                        name="roomsCount"
                        min="1"
                        value={formData.roomsCount}
                        onChange={handleChange}
                        placeholder="e.g. 15"
                        className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Total Bed Capacity <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        min="1"
                        value={formData.capacity}
                        onChange={handleChange}
                        placeholder="e.g. 30"
                        className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Property Location */}
                  <div className="space-y-4 pt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Property Location</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Hostel Address <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          name="hostelAddress"
                          value={formData.hostelAddress}
                          onChange={handleChange}
                          placeholder="Plot / Building No., Street, Area"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Pincode <span className="text-[#EF4444]">*</span></span>
                          {pincodeLoading && <span className="text-emerald-400 text-[10px] font-normal flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Looking up...</span>}
                        </label>
                        <input
                          name="pincode"
                          value={formData.pincode}
                          onChange={(e) => onPincodeInput(e, "hostel")}
                          placeholder="e.g. 110001"
                          maxLength={6}
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">City</label>
                        <input
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g. New Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">District</label>
                        <input
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          placeholder="e.g. South Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">State</label>
                        <input
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="e.g. Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hostel License Upload Card */}
                  <div className="pt-2">
                    <DocumentCapture
                      title="Hostel Registration Document / License"
                      subtitle="Upload trade license, municipal registration, or fire safety certificate (optional)"
                      document={formData.licensePhoto}
                      onCapture={(doc) => updateFormData({ licensePhoto: doc })}
                      onRemove={() => updateFormData({ licensePhoto: null })}
                      required={false}
                    />
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* STEP 04 — DOCUMENTS CHECKLIST */}
              {/* ========================================================================= */}
              {step === 3 && (
                <motion.div key="step-3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                  <div className="border-b border-[#202B45] pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileCheck size={18} className="text-emerald-400" /> Step 4: Documents Dashboard & Verification
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Review all attached verification documents before final submission.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        name: "Owner Profile Photo",
                        doc: formData.ownerPhoto || formData.selfie,
                        required: false,
                        type: "owner",
                      },
                      {
                        name: "Aadhaar Front Image",
                        doc: formData.frontDoc,
                        required: true,
                        type: "front",
                      },
                      {
                        name: "Aadhaar Back Image",
                        doc: formData.backDoc,
                        required: formData.idType === "Aadhaar",
                        type: "back",
                      },
                      {
                        name: "Hostel Trade License",
                        doc: formData.licensePhoto,
                        required: false,
                        type: "license",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-md transition ${
                          item.doc
                            ? "bg-[#0B1220] border-emerald-500/30"
                            : item.required
                            ? "bg-[#0B1220] border-amber-500/30"
                            : "bg-[#0B1220] border-[#202B45]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                item.doc ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              <FileText size={16} />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">{item.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {item.required ? "Required Document" : "Optional Document"}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.doc
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : item.required
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {item.doc ? "✓ Uploaded" : item.required ? "Pending" : "Optional"}
                          </span>
                        </div>

                        {item.doc && (
                          <div className="flex items-center gap-2 pt-2 border-t border-[#202B45]/60">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(item.doc)}
                              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={12} /> Preview
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* STEP 05 — REVIEW & SUBMIT */}
              {/* ========================================================================= */}
              {step === 4 && (
                <motion.div key="step-4" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                  <div className="border-b border-[#202B45] pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-400" /> Step 5: Final Review & Confirmation
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Please verify all information before submitting your registration application.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Owner Card */}
                    <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#202B45] pb-2.5">
                        <User size={15} /> Owner Information
                      </div>
                      <div className="space-y-2 text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Name:</span>
                          <span className="font-bold text-white">{formData.ownerName || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-bold text-white">{formData.phone || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="text-slate-300">{formData.email || "None"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Address:</span>
                          <span className="text-slate-300 text-right truncate max-w-[180px]">{formData.ownerAddress || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* KYC Card */}
                    <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#202B45] pb-2.5">
                        <Shield size={15} /> KYC Verification
                      </div>
                      <div className="space-y-2 text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">ID Type:</span>
                          <span className="font-bold text-white">{formData.idType || "Aadhaar"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Masked ID Number:</span>
                          <span className="font-mono text-emerald-400 font-bold">{maskDocNumber(formData.idNumber)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Front Document:</span>
                          <span className={formData.frontDoc ? "text-emerald-400 font-bold" : "text-amber-400"}>
                            {formData.frontDoc ? "✓ Uploaded" : "○ Pending"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Back Document:</span>
                          <span className={formData.backDoc ? "text-emerald-400 font-bold" : "text-slate-400"}>
                            {formData.backDoc ? "✓ Uploaded" : "○ Optional"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hostel Details Card */}
                    <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#202B45] pb-2.5">
                        <Building2 size={15} /> Hostel & Capacity Summary
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Hostel Name</span>
                          <span className="font-bold text-white">{formData.hostelName || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Type</span>
                          <span className="font-medium text-slate-200">{formData.hostelType || "Boys Hostel"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Rooms</span>
                          <span className="font-bold text-white">{formData.roomsCount} Rooms</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Total Beds</span>
                          <span className="font-bold text-white">{formData.capacity} Beds</span>
                        </div>
                        <div className="sm:col-span-4">
                          <span className="text-slate-400 text-[11px] block">Property Address</span>
                          <span className="font-medium text-slate-200">
                            {formData.hostelAddress}, {formData.city}, {formData.state} - {formData.pincode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      By submitting this registration, you confirm that the property information and identity documents provided are genuine and accurate.
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* SUCCESS SCREEN (Step 5) */}
              {/* ========================================================================= */}
              {step === 5 && (
                <motion.div
                  key="step-success"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="text-center py-10 space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                    <Check size={40} className="stroke-[3]" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white">Registration Application Submitted!</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                      Your hostel onboarding request has been received. Our administration team will review your KYC documents and contact you on WhatsApp once approved.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#202B45] max-w-md mx-auto text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hostel Name:</span>
                      <span className="font-bold text-white">{formData.hostelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Owner Name:</span>
                      <span className="font-bold text-white">{formData.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-amber-400">Pending Review</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => navigate("/request-status")}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
                    >
                      Track Application Status
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="px-6 py-3 rounded-xl bg-[#0B1220] hover:bg-white/5 text-white font-bold text-xs border border-[#202B45] transition cursor-pointer"
                    >
                      Go to Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Action Buttons (Steps 0-4) */}
            {step < 5 && (
              <div className="pt-6 mt-6 border-t border-[#202B45] flex items-center justify-between gap-4">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="px-5 py-3 rounded-xl bg-[#0B1220] hover:bg-white/5 text-slate-300 hover:text-white font-bold text-xs border border-[#202B45] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer min-h-[44px]"
                  >
                    <span>Continue</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => submitRegistration("public")}
                    disabled={loading}
                    className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50 min-h-[48px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-slate-950" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Submit Registration</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Camera Capture Modals */}
      {isSelfieCameraOpen && (
        <CameraCapture
          title="Take Owner Photo / Selfie"
          onCapture={(base64) => {
            updateFormData({ ownerPhoto: base64, selfie: base64 });
            setIsSelfieCameraOpen(false);
          }}
          onClose={() => setIsSelfieCameraOpen(false)}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg w-full bg-[#131C2E] border border-[#202B45] rounded-3xl p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-slate-300 hover:text-white"
            >
              ✕
            </button>
            <img src={previewImage} alt="Document Preview" className="w-full h-auto rounded-2xl object-contain max-h-[70vh]" />
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterPage;
