import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
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
  Loader2,
  Lock,
  FileText,
  Eye,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  CheckCircle,
  RefreshCw,
  Edit3,
  Building,
  CreditCard,
  Layers,
  HelpCircle,
} from "lucide-react";
import useOwnerCreation from "../superadmin/hooks/useOwnerCreation";
import CameraCapture from "../superadmin/components/forms/CameraCapture";
import { compressImage } from "../utils/imageCompressor";

const WIZARD_STEPS = [
  { num: "01", label: "Owner", fullLabel: "Owner Information", icon: User },
  { num: "02", label: "Documents", fullLabel: "Owner Documents", icon: Shield },
  { num: "03", label: "Hostel", fullLabel: "Hostel Details", icon: Building2 },
  { num: "04", label: "Review", fullLabel: "Review & Verify", icon: CheckCircle2 },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState("welcome"); // "welcome" | "wizard"
  const [confirmAccurate, setConfirmAccurate] = useState(false);

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

  // Camera modal states
  const [activeCameraModal, setActiveCameraModal] = useState(null); // { title, targetField, defaultFacingMode, isDocument }
  const [previewImage, setPreviewImage] = useState(null);

  // Field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  // Pincode input handler
  const onPincodeInput = (e, target = "hostel") => {
    const val = e.target.value;
    if (handlePincodeChange) {
      handlePincodeChange(val, target);
    } else {
      handleChange(e);
    }
  };

  // Generic file upload to base64 helper
  const handleGenericFileUpload = (fieldName, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const result = evt.target?.result;
        if (result) {
          const compressed = await compressImage(result, { maxDimension: 1000, quality: 0.72 });
          updateFormData({ [fieldName]: compressed || result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Mask sensitive Aadhaar/ID numbers for review
  const maskDocNumber = (num = "") => {
    if (!num) return "Not Specified";
    const cleaned = String(num).replace(/\s+/g, "");
    if (cleaned.length >= 8) {
      return `XXXX XXXX ${cleaned.slice(-4)}`;
    }
    return `XXXX ${cleaned.slice(-3)}`;
  };

  // Document types available
  const DOC_TYPES = [
    { id: "Aadhaar", label: "Aadhaar Card", twoSided: true },
    { id: "Passport", label: "Passport", twoSided: false },
    { id: "Driving Licence", label: "Driving Licence", twoSided: true },
    { id: "Voter ID", label: "Voter ID", twoSided: false },
  ];

  const currentDocType = DOC_TYPES.find((d) => d.id === formData.idType) || DOC_TYPES[0];

  // Motion transitions
  const pageVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, transition: { duration: 0.15 } },
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full filter blur-[140px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* PAGE 0: WELCOME / LANDING PAGE VIEW (Completely separate from form)        */}
      {/* ========================================================================= */}
      {viewMode === "welcome" && (
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-6xl mx-auto w-full relative z-10">
          {/* Top Brand Header */}
          <header className="flex items-center justify-between border-b border-[#202B45] pb-6">
            <div className="flex items-center gap-3.5">
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

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#131C2E] border border-[#202B45] hover:border-emerald-500/30 px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer min-h-[44px]"
            >
              <ArrowLeft size={15} /> Back to Login
            </button>
          </header>

          {/* Hero Content Section */}
          <main className="py-12 sm:py-16 space-y-10">
            {/* Headline and Supporting Copy */}
            <div className="space-y-5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Enterprise Property Onboarding</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Build and manage your hostel with confidence.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Register your property on HostelMate. Our streamlined onboarding securely verifies owner KYC, room capacity, and licensing before account activation.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-[#131C2E]/90 border border-[#202B45] space-y-3 shadow-xl hover:border-emerald-500/30 transition">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <h3 className="text-base font-bold text-white">Multi-Room & Bed Inventory</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time room occupancy, floor plans, and tenant check-ins with automated room assignment.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#131C2E]/90 border border-[#202B45] space-y-3 shadow-xl hover:border-emerald-500/30 transition">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Smartphone size={24} />
                </div>
                <h3 className="text-base font-bold text-white">Automated WhatsApp Receipts</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  One-click rent reminders, invoice sharing, and digital payment confirmations directly via WhatsApp.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#131C2E]/90 border border-[#202B45] space-y-3 shadow-xl hover:border-emerald-500/30 transition">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <h3 className="text-base font-bold text-white">Digital KYC & Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Secure Aadhaar verification, encrypted document management, and verified owner approval workflows.
                </p>
              </div>
            </div>

            {/* Trust Indicators Bar */}
            <div className="p-5 rounded-2xl bg-[#131C2E]/60 border border-[#202B45] grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <Lock size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">256-bit Secure</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 border-x border-[#202B45]">
                <Shield size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Verified Owner</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <FileCheck size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">KYC Protected</span>
              </div>
            </div>

            {/* Primary & Secondary Call to Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setViewMode("wizard");
                  setStep(0);
                }}
                className="py-4 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition cursor-pointer min-h-[54px]"
              >
                <span>Start Registration</span>
                <ArrowRight size={18} className="stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="py-4 px-6 rounded-2xl bg-[#131C2E] hover:bg-white/5 text-slate-300 hover:text-white font-bold text-sm border border-[#202B45] transition flex items-center justify-center min-h-[54px] cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </main>

          {/* Welcome Footer */}
          <footer className="pt-6 border-t border-[#202B45] text-xs text-slate-500 flex items-center justify-between">
            <span>HostelMate SaaS Platform</span>
            <span>Powered by BetaMind Tech Solutions</span>
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WIZARD MODE: 4-STEP REGISTRATION WIZARD + SUCCESS SCREEN                  */}
      {/* ========================================================================= */}
      {viewMode === "wizard" && (
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full relative z-10">
          <div className="space-y-6">
            {/* Top Navigation & Controls */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  if (step > 0 && step < 4) {
                    prevStep();
                  } else {
                    setViewMode("welcome");
                  }
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#131C2E] border border-[#202B45] hover:border-emerald-500/30 px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer min-h-[40px]"
              >
                <ArrowLeft size={14} />
                {step === 0 ? "Back to Welcome" : "Back"}
              </button>

              <div className="flex items-center gap-3">
                {step < 4 && (
                  <div className="flex items-center gap-2 bg-[#131C2E] border border-[#202B45] px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-400 shadow-sm">
                    <Sparkles size={13} className="animate-pulse" />
                    <span>STEP {step + 1} OF 4</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Exit to Login
                </button>
              </div>
            </div>

            {/* Desktop Horizontal 4-Step Stepper (01 Owner -> 02 Documents -> 03 Hostel -> 04 Review) */}
            {step < 4 && (
              <div className="hidden sm:flex bg-[#131C2E]/90 backdrop-blur-xl border border-[#202B45] rounded-2xl p-4 items-center justify-between shadow-xl">
                {WIZARD_STEPS.map((s, idx) => {
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
                      {idx !== WIZARD_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${idx < step ? "bg-emerald-500/50" : "bg-[#202B45]"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile Compact Stepper */}
            {step < 4 && (
              <div className="sm:hidden bg-[#131C2E] border border-[#202B45] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-400 uppercase tracking-wider">STEP {step + 1} OF 4</span>
                  <span className="text-white">{WIZARD_STEPS[step]?.fullLabel}</span>
                </div>
                <div className="w-full bg-[#0B1220] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${((step + 1) / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Form Container Card */}
            <div className="bg-[#131C2E]/90 backdrop-blur-xl border border-[#202B45] rounded-3xl p-6 sm:p-8 shadow-2xl relative min-h-[440px]">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs font-medium flex items-center gap-3 shadow-lg">
                  <AlertTriangle size={18} className="text-[#EF4444] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* ========================================================================= */}
                {/* PAGE 1 (Step 0) — OWNER INFORMATION                                      */}
                {/* ========================================================================= */}
                {step === 0 && (
                  <motion.div key="step-0" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <div className="border-b border-[#202B45] pb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User size={20} className="text-emerald-400" /> Owner Information
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Tell us about the primary owner of the property.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Owner Full Name <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          name="ownerName"
                          value={formData.ownerName}
                          onChange={handleChange}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Primary Mobile */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Primary Mobile Number (WhatsApp) <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. 9876543210"
                          maxLength={10}
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <span className="text-[11px] text-slate-400 block">Used for login and WhatsApp notifications.</span>
                      </div>

                      {/* Email Address */}
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
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Pincode (Triggers Auto-Fetch) */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Residential Pincode <span className="text-[#EF4444]">*</span></span>
                          {pincodeLoading && (
                            <span className="text-emerald-400 text-[10px] font-normal flex items-center gap-1">
                              <Loader2 size={10} className="animate-spin" /> Looking up...
                            </span>
                          )}
                        </label>
                        <input
                          name="ownerPincode"
                          value={formData.ownerPincode}
                          onChange={(e) => onPincodeInput(e, "owner")}
                          placeholder="e.g. 110001 (6 digits)"
                          maxLength={6}
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20 font-mono"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">State</label>
                        <input
                          name="ownerState"
                          value={formData.ownerState}
                          onChange={handleChange}
                          placeholder="e.g. Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                        />
                      </div>

                      {/* District */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">District</label>
                        <input
                          name="ownerDistrict"
                          value={formData.ownerDistrict}
                          onChange={handleChange}
                          placeholder="e.g. Central Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                        />
                      </div>

                      {/* Place / City */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Place / City</label>
                        <input
                          name="ownerCity"
                          value={formData.ownerCity}
                          onChange={handleChange}
                          placeholder="e.g. Connaught Place, New Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                        />
                      </div>

                      {/* Full Residential Address */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Full Residential Address <span className="text-[#EF4444]">*</span>
                        </label>
                        <textarea
                          name="ownerAddress"
                          rows={3}
                          value={formData.ownerAddress}
                          onChange={handleChange}
                          placeholder="House/Flat No., Building Name, Street, Landmark"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================================= */}
                {/* PAGE 2 (Step 1) — OWNER DOCUMENTS & IDENTITY KYC                          */}
                {/* ========================================================================= */}
                {step === 1 && (
                  <motion.div key="step-1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                    <div className="border-b border-[#202B45] pb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield size={20} className="text-emerald-400" /> Owner Documents
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Upload the owner's photo and identity document for verification.
                      </p>
                    </div>

                    {/* SECTION A — OWNER PHOTO */}
                    <div className="p-5 rounded-2xl bg-[#0B1220] border border-[#202B45] space-y-4 shadow-md">
                      <div className="flex items-center justify-between border-b border-[#202B45] pb-3">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Owner Profile Photo</h4>
                          <p className="text-[11px] text-slate-400">Capture a selfie or upload a clear passport-size photo.</p>
                        </div>
                        {(formData.ownerPhoto || formData.selfie) && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                            <Check size={12} /> Captured
                          </span>
                        )}
                      </div>

                      {formData.ownerPhoto || formData.selfie ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#131C2E] p-4 rounded-xl border border-[#202B45]">
                          <img
                            src={formData.ownerPhoto || formData.selfie}
                            alt="Owner Profile"
                            className="w-24 h-24 rounded-xl object-cover border border-emerald-500/40 shadow-md shrink-0"
                          />
                          <div className="space-y-2 text-center sm:text-left flex-1">
                            <span className="text-xs font-bold text-white block">Profile Photo Attached</span>
                            <p className="text-[11px] text-slate-400">Ready for verification upon application submission.</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCameraModal({
                                    title: "Retake Owner Photo",
                                    targetField: "ownerPhoto",
                                    defaultFacingMode: "user",
                                    isDocument: false,
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
                              >
                                <RefreshCw size={13} /> Retake
                              </button>
                              <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 flex items-center gap-1.5 transition cursor-pointer min-h-[38px]">
                                <Upload size={13} /> Replace
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleGenericFileUpload("ownerPhoto", e)}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => updateFormData({ ownerPhoto: null, selfie: null })}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20 flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-[#202B45] hover:border-emerald-500/40 rounded-2xl p-6 text-center space-y-3 bg-[#131C2E]/40 transition">
                          <p className="text-xs text-slate-400">Take a photo using your camera or upload an image file</p>
                          <div className="flex items-center justify-center gap-3 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCameraModal({
                                  title: "Take Owner Photo (Selfie)",
                                  targetField: "ownerPhoto",
                                  defaultFacingMode: "user",
                                  isDocument: false,
                                })
                              }
                              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md min-h-[44px]"
                            >
                              <Camera size={15} /> 📷 Camera (Selfie)
                            </button>
                            <label className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 flex items-center gap-2 transition cursor-pointer min-h-[44px]">
                              <Upload size={15} /> 📁 Upload Photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleGenericFileUpload("ownerPhoto", e)}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION B — IDENTITY DOCUMENT */}
                    <div className="p-5 rounded-2xl bg-[#0B1220] border border-[#202B45] space-y-5 shadow-md">
                      <div className="border-b border-[#202B45] pb-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Identity Document</h4>
                        <p className="text-[11px] text-slate-400">Select one government-issued ID for verification.</p>
                      </div>

                      {/* Single Document Type Selector Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {DOC_TYPES.map((doc) => {
                          const isSelected = formData.idType === doc.id;
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => updateFormData({ idType: doc.id })}
                              className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 min-h-[46px] cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                                  : "bg-[#131C2E] border-[#202B45] text-slate-400 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <FileText size={15} />
                              <span>{doc.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Corresponding Document Number Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {formData.idType === "Aadhaar"
                            ? "12-Digit Aadhaar Number"
                            : `${formData.idType} Number`}{" "}
                          <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          name="idNumber"
                          value={formData.idNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (formData.idType === "Aadhaar") {
                              const numeric = val.replace(/\D/g, "").slice(0, 12);
                              updateFormData({ idNumber: numeric });
                            } else {
                              updateFormData({ idNumber: val });
                            }
                          }}
                          maxLength={formData.idType === "Aadhaar" ? 12 : 25}
                          placeholder={
                            formData.idType === "Aadhaar"
                              ? "e.g. 123456789012 (12 digits)"
                              : `Enter your ${formData.idType} number`
                          }
                          className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20 font-mono"
                        />
                        {formData.idType === "Aadhaar" && (
                          <span className="text-[11px] text-slate-400 block">
                            Enter all 12 numeric digits without spaces or dashes.
                          </span>
                        )}
                      </div>

                      {/* Front & Back Document Capture Cards */}
                      <div className={`grid grid-cols-1 ${currentDocType.twoSided ? "md:grid-cols-2" : ""} gap-4 pt-1`}>
                        {/* Front Side */}
                        <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200">
                              {formData.idType} Front Side <span className="text-[#EF4444]">*</span>
                            </span>
                            {formData.frontDoc && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check size={12} /> Captured
                              </span>
                            )}
                          </div>

                          {formData.frontDoc ? (
                            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-36 flex items-center justify-center group">
                              <img src={formData.frontDoc} alt="Front Document" className="h-full w-auto object-contain" />
                              <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(formData.frontDoc)}
                                  className="p-2 bg-emerald-500 text-slate-950 rounded-lg font-bold text-xs"
                                  title="Preview"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveCameraModal({
                                      title: `Capture ${formData.idType} Front`,
                                      targetField: "frontDoc",
                                      defaultFacingMode: "environment",
                                      isDocument: true,
                                    })
                                  }
                                  className="p-2 bg-blue-500 text-white rounded-lg"
                                  title="Retake"
                                >
                                  <Camera size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateFormData({ frontDoc: null })}
                                  className="p-2 bg-red-500 text-white rounded-lg"
                                  title="Remove"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-[#202B45] hover:border-emerald-500/40 rounded-xl p-5 text-center space-y-2.5 bg-white/[0.01] transition">
                              <p className="text-[11px] text-slate-400">Front side containing photo and ID number</p>
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveCameraModal({
                                      title: `Capture ${formData.idType} Front Side`,
                                      targetField: "frontDoc",
                                      defaultFacingMode: "environment",
                                      isDocument: true,
                                    })
                                  }
                                  className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs flex items-center gap-1.5 transition min-h-[40px] cursor-pointer"
                                >
                                  <Camera size={14} /> 📷 Camera
                                </button>
                                <label className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[40px]">
                                  <Upload size={14} /> 📁 Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleGenericFileUpload("frontDoc", e)}
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Back Side (Shown when two-sided) */}
                        {currentDocType.twoSided && (
                          <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200">
                                {formData.idType} Back Side <span className="text-[#EF4444]">*</span>
                              </span>
                              {formData.backDoc && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check size={12} /> Captured
                                </span>
                              )}
                            </div>

                            {formData.backDoc ? (
                              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-36 flex items-center justify-center group">
                                <img src={formData.backDoc} alt="Back Document" className="h-full w-auto object-contain" />
                                <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage(formData.backDoc)}
                                    className="p-2 bg-emerald-500 text-slate-950 rounded-lg font-bold text-xs"
                                    title="Preview"
                                  >
                                    <Eye size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveCameraModal({
                                        title: `Capture ${formData.idType} Back`,
                                        targetField: "backDoc",
                                        defaultFacingMode: "environment",
                                        isDocument: true,
                                      })
                                    }
                                    className="p-2 bg-blue-500 text-white rounded-lg"
                                    title="Retake"
                                  >
                                    <Camera size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateFormData({ backDoc: null })}
                                    className="p-2 bg-red-500 text-white rounded-lg"
                                    title="Remove"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-[#202B45] hover:border-emerald-500/40 rounded-xl p-5 text-center space-y-2.5 bg-white/[0.01] transition">
                                <p className="text-[11px] text-slate-400">Back side containing permanent address details</p>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveCameraModal({
                                        title: `Capture ${formData.idType} Back Side`,
                                        targetField: "backDoc",
                                        defaultFacingMode: "environment",
                                        isDocument: true,
                                      })
                                    }
                                    className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs flex items-center gap-1.5 transition min-h-[40px] cursor-pointer"
                                  >
                                    <Camera size={14} /> 📷 Camera
                                  </button>
                                  <label className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[40px]">
                                    <Upload size={14} /> 📁 Upload
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleGenericFileUpload("backDoc", e)}
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================================= */}
                {/* PAGE 3 (Step 2) — HOSTEL DETAILS                                         */}
                {/* ========================================================================= */}
                {step === 2 && (
                  <motion.div key="step-2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <div className="border-b border-[#202B45] pb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Building2 size={20} className="text-emerald-400" /> Hostel Details
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Tell us about the property you want to manage.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Hostel Name */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Hostel / Property Name <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          name="hostelName"
                          value={formData.hostelName}
                          onChange={handleChange}
                          placeholder="e.g. Royal Living PG & Hostel"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Hostel Type */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Hostel Category / Type <span className="text-[#EF4444]">*</span>
                        </label>
                        <select
                          name="hostelType"
                          value={formData.hostelType}
                          onChange={handleChange}
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="Boys Hostel">Boys Hostel</option>
                          <option value="Girls Hostel">Girls Hostel</option>
                          <option value="Co-Living PG">Co-Living PG</option>
                          <option value="Working Professionals">Working Professionals</option>
                        </select>
                      </div>

                      {/* Pincode (Triggers Auto-Fetch) */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Property Pincode <span className="text-[#EF4444]">*</span></span>
                          {pincodeLoading && (
                            <span className="text-emerald-400 text-[10px] font-normal flex items-center gap-1">
                              <Loader2 size={10} className="animate-spin" /> Looking up...
                            </span>
                          )}
                        </label>
                        <input
                          name="pincode"
                          value={formData.pincode}
                          onChange={(e) => onPincodeInput(e, "hostel")}
                          placeholder="e.g. 110001 (6 digits)"
                          maxLength={6}
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px] focus:ring-2 focus:ring-emerald-500/20 font-mono"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">State</label>
                        <input
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="e.g. Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                        />
                      </div>

                      {/* District */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">District</label>
                        <input
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          placeholder="e.g. South Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                        />
                      </div>

                      {/* Place / City */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Place / City</label>
                        <input
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g. Hauz Khas, New Delhi"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                        />
                      </div>

                      {/* Full Hostel Address */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Full Hostel Address <span className="text-[#EF4444]">*</span>
                        </label>
                        <textarea
                          name="hostelAddress"
                          rows={2}
                          value={formData.hostelAddress}
                          onChange={handleChange}
                          placeholder="Plot / Building No., Street, Area, Landmark"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        />
                      </div>

                      {/* Total Number of Rooms */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Total Number of Rooms <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="number"
                          name="roomsCount"
                          min="1"
                          value={formData.roomsCount}
                          onChange={handleChange}
                          placeholder="e.g. 15"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                        />
                      </div>

                      {/* Total Available Beds */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Total Available Beds <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          min="1"
                          value={formData.capacity}
                          onChange={handleChange}
                          placeholder="e.g. 30"
                          className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                        />
                      </div>
                    </div>

                    {/* Property Image & License Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Hostel Property Image */}
                      <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">Hostel / Property Image</span>
                          {formData.coverImage && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check size={12} /> Added
                            </span>
                          )}
                        </div>

                        {formData.coverImage ? (
                          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-32 flex items-center justify-center group">
                            <img src={formData.coverImage} alt="Hostel" className="h-full w-auto object-contain" />
                            <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(formData.coverImage)}
                                className="p-2 bg-emerald-500 text-slate-950 rounded-lg font-bold text-xs"
                                title="Preview"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateFormData({ coverImage: null, hostelPhoto: null })}
                                className="p-2 bg-red-500 text-white rounded-lg"
                                title="Remove"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-[#202B45] hover:border-emerald-500/40 rounded-xl p-4 text-center space-y-2 bg-white/[0.01]">
                            <p className="text-[11px] text-slate-400">Front entrance or building exterior photo</p>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCameraModal({
                                    title: "Capture Hostel Exterior Photo",
                                    targetField: "coverImage",
                                    defaultFacingMode: "environment",
                                    isDocument: false,
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs flex items-center gap-1.5 transition min-h-[38px] cursor-pointer"
                              >
                                <Camera size={14} /> 📷 Camera
                              </button>
                              <label className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[38px]">
                                <Upload size={14} /> 📁 Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleGenericFileUpload("coverImage", e)}
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hostel License (Optional) */}
                      <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">
                            Hostel License / Registration <span className="text-slate-500 font-normal lowercase">(optional)</span>
                          </span>
                          {formData.licensePhoto && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check size={12} /> Added
                            </span>
                          )}
                        </div>

                        {formData.licensePhoto ? (
                          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-32 flex items-center justify-center group">
                            <img src={formData.licensePhoto} alt="License" className="h-full w-auto object-contain" />
                            <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(formData.licensePhoto)}
                                className="p-2 bg-emerald-500 text-slate-950 rounded-lg font-bold text-xs"
                                title="Preview"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateFormData({ licensePhoto: null })}
                                className="p-2 bg-red-500 text-white rounded-lg"
                                title="Remove"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-[#202B45] hover:border-emerald-500/40 rounded-xl p-4 text-center space-y-2 bg-white/[0.01]">
                            <p className="text-[11px] text-slate-400">Trade license or municipal certificate if available</p>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCameraModal({
                                    title: "Capture Hostel License Document",
                                    targetField: "licensePhoto",
                                    defaultFacingMode: "environment",
                                    isDocument: true,
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs flex items-center gap-1.5 transition min-h-[38px] cursor-pointer"
                              >
                                <Camera size={14} /> 📷 Camera
                              </button>
                              <label className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[38px]">
                                <Upload size={14} /> 📁 Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleGenericFileUpload("licensePhoto", e)}
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================================= */}
                {/* PAGE 4 (Step 3) — REVIEW & VERIFY                                        */}
                {/* ========================================================================= */}
                {step === 3 && (
                  <motion.div key="step-3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                    <div className="border-b border-[#202B45] pb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-emerald-400" /> Review Your Registration
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Review all information before submitting your HostelMate application.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* SECTION 1: OWNER INFORMATION */}
                      <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#202B45] pb-2.5">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <User size={15} /> 1. Owner Information
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(0)}
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Full Name</span>
                            <span className="font-bold text-white">{formData.ownerName || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Primary Mobile</span>
                            <span className="font-bold text-white">{formData.phone || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Email</span>
                            <span className="text-slate-300">{formData.email || "None"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Pincode & Location</span>
                            <span className="text-slate-300">
                              {formData.ownerPincode} • {formData.ownerCity || ""}, {formData.ownerState || ""}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 text-[11px] block">Residential Address</span>
                            <span className="text-slate-300">{formData.ownerAddress || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: OWNER DOCUMENTS */}
                      <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#202B45] pb-2.5">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Shield size={15} /> 2. Owner Documents & KYC
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Owner Photo</span>
                            <span className={formData.ownerPhoto || formData.selfie ? "text-emerald-400 font-bold" : "text-amber-400"}>
                              {formData.ownerPhoto || formData.selfie ? "✓ Uploaded" : "Missing / Optional"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Identity Document</span>
                            <span className="font-bold text-white">{formData.idType || "Aadhaar"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Masked ID Number</span>
                            <span className="font-mono text-emerald-400 font-bold">{maskDocNumber(formData.idNumber)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Document Front / Back</span>
                            <span className="text-slate-300">
                              Front: {formData.frontDoc ? "✓ Uploaded" : "Missing"} • Back:{" "}
                              {formData.backDoc ? "✓ Uploaded" : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: HOSTEL DETAILS */}
                      <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#202B45] pb-2.5">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={15} /> 3. Hostel Details & Capacity
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Hostel Name</span>
                            <span className="font-bold text-white">{formData.hostelName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Type</span>
                            <span className="font-medium text-slate-200">{formData.hostelType}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Rooms</span>
                            <span className="font-bold text-white">{formData.roomsCount} Rooms</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Total Beds</span>
                            <span className="font-bold text-white">{formData.capacity} Beds</span>
                          </div>
                          <div className="col-span-2 sm:col-span-4">
                            <span className="text-slate-400 text-[11px] block">Property Address</span>
                            <span className="text-slate-300">
                              {formData.hostelAddress}, {formData.city}, {formData.state} - {formData.pincode}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 4: LICENSE */}
                      <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-2">
                        <div className="flex items-center justify-between border-b border-[#202B45] pb-2.5">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={15} /> 4. License & Property Image
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Property Image</span>
                            <span className={formData.coverImage ? "text-emerald-400 font-bold" : "text-slate-400"}>
                              {formData.coverImage ? "✓ Uploaded" : "Not Provided"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Hostel License</span>
                            <span className={formData.licensePhoto ? "text-emerald-400 font-bold" : "text-slate-400"}>
                              {formData.licensePhoto ? "✓ Uploaded" : "Optional / Not Provided"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final Confirmation Checkbox */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmAccurate}
                          onChange={(e) => setConfirmAccurate(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-[#0B1220] border-[#202B45]"
                        />
                        <span className="leading-relaxed">
                          I confirm that all provided property information and identity documents are accurate and genuine.
                        </span>
                      </label>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================================= */}
                {/* PAGE 5 (Step 4) — SUCCESS / THANK YOU SCREEN                             */}
                {/* ========================================================================= */}
                {step === 4 && (
                  <motion.div
                    key="step-4-success"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="text-center py-10 space-y-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                      <Check size={40} className="stroke-[3]" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white">Registration Submitted Successfully</h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                        Thank you for registering your property with HostelMate.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#0B1220] border border-[#202B45] max-w-md mx-auto text-left space-y-2.5 text-xs">
                      {submittedResult?.requestId && (
                        <div className="flex justify-between border-b border-[#202B45] pb-2">
                          <span className="text-slate-400">Application Reference:</span>
                          <span className="font-mono font-bold text-emerald-400">{submittedResult.requestId}</span>
                        </div>
                      )}
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

                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      "Our team will review your owner and property details before activating your HostelMate account. You will receive an update on WhatsApp once approved."
                    </p>

                    <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
                      <button
                        type="button"
                        onClick={() => navigate("/request-status")}
                        className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer min-h-[48px]"
                      >
                        Track Application Status
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="px-6 py-3.5 rounded-xl bg-[#0B1220] hover:bg-white/5 text-white font-bold text-xs border border-[#202B45] transition cursor-pointer min-h-[48px]"
                      >
                        Go to Login
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wizard Bottom Action Buttons (Steps 0-3) */}
              {step < 4 && (
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
                    <button
                      type="button"
                      onClick={() => setViewMode("welcome")}
                      className="px-5 py-3 rounded-xl bg-[#0B1220] hover:bg-white/5 text-slate-400 hover:text-white font-bold text-xs border border-[#202B45] transition flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                    >
                      <ArrowLeft size={14} /> Back to Welcome
                    </button>
                  )}

                  {step < 3 ? (
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
                      disabled={loading || !confirmAccurate}
                      className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition cursor-pointer disabled:opacity-40 min-h-[48px]"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-slate-950" />
                          <span>Submitting Registration...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Registration</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reusable Camera Capture Modal */}
      {activeCameraModal && (
        <CameraCapture
          isOpen={true}
          onClose={() => setActiveCameraModal(null)}
          title={activeCameraModal.title}
          defaultFacingMode={activeCameraModal.defaultFacingMode || "user"}
          isDocument={activeCameraModal.isDocument || false}
          onConfirm={(base64Image) => {
            updateFormData({ [activeCameraModal.targetField]: base64Image });
            setActiveCameraModal(null);
          }}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg w-full bg-[#131C2E] border border-[#202B45] rounded-3xl p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-slate-300 hover:text-white"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto rounded-2xl object-contain max-h-[75vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterPage;
